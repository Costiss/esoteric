# TECHNINAL SPEC BACKEND

This document updates the previously agreed technical design to incorporate three project-wide decisions:

- Use ULIDs instead of UUIDs for primary identifiers (better sorting, readability, brevity).
- Persist ephemeral OAuth2/authorization data in a valkey cache layer (TTL-backed, atomic operations).
- Implement the backend as a modular monolith for maintainability and operational simplicity.

Contents

- Architecture overview
- IDs & storage (ULID)
- OAuth2 changes (valkey cache for ephemeral data)
- Data model highlights (DDL snippets)
- Modular monolith layout and runtime notes
- API and examples (updated)
- Implementation notes & next steps

1. Architecture overview

---

Keep the overall architecture described in REQUIREMENTS.md: a single backend service (Rust + Axum + Diesel + HTTP/2) and mobile clients (React Native + TypeScript + Tamagui). The backend will be implemented as a modular monolith: a single deployable binary composed from well-separated modules.

Core modules (examples)

- common: logging, errors, config, types, telemetry
- db: Diesel schema, migrations, connection pool, transaction helpers
- auth: OAuth2 authorization server, token issuance, JWT/JWKS
- users: user creation, profile updates
- providers: provider profiles, services, availability
- bookings: appointment lifecycle, availability reservation
- payments: payment intent orchestration, provider commission
- notifications: email, push worker hooks
- admin: admin APIs and dashboards

Modules are compiled into a single binary but live in separate Rust modules/crates (recommended workspace layout under `backend/crates/*`) for strong boundaries and easier testing.

2. IDs & storage (use ULID)

---

- All primary keys and public identifiers use ULIDs instead of UUIDs. Use a ULID library on the server (for Rust: `ulid` or `ulid-rs`) and generate IDs at application layer before inserts.
- Persist ULIDs as `CHAR(26)` or `TEXT` in Postgres (26-character canonical Crockford base32 representation). Example column type: `CHAR(26) NOT NULL PRIMARY KEY`.
- Advantages: lexicographically sortable, smaller and more human-friendly, easier to display in UIs and logs.
- Foreign keys and indexes use the same textual ULID column types.

3. OAuth2: ephemeral data in valkey cache

---

We persist short-lived, ephemeral OAuth2 artifacts (authorization codes, PKCE code challenges/verifiers while code is pending, one-time authorization grants, short-lived device codes, temporary state objects) in a valkey cache layer instead of in the primary Postgres tables. Long-lived artifacts (refresh tokens, access token revocation lists, client registrations if confidential) remain persisted in Postgres.

Valkey cache requirements

- TTL support for keys and atomic set/get/delete operations.
- Optional persistence or replication depending on availability needs; treat valkey as the canonical store for ephemerals.
- Strong consistency for one-time codes (store-and-delete semantics on token exchange).

Flow examples

- Authorization Code issuance (mobile/public client + PKCE):
  1. Client calls /oauth/authorize -> server creates an authorization grant record in valkey keyed by `code:<ULID>` with payload {user_id, client_id, redirect_uri, scopes, code_challenge, created_at} TTL 10m.
  2. Server redirects client with code (the ULID). The code is one-time-use.
  3. Client exchanges code at /oauth/token with code_verifier. Server retrieves and atomically deletes `code:<ULID>` from valkey, validates PKCE, and issues access_token + refresh_token. If delete fails or key missing, reject.

- Device flow / ephemeral sessions and ephemeral consent states follow the same pattern (valkey keys with structured JSON value and TTL).

Security notes for valkey

- Always operate valkey over TLS and with authentication between backend and the cache.
- Ensure logs do not leak full token contents; log only key names or truncated values.
- Implement replay protection by atomically deleting authorization codes during token exchange.

4. Data model highlights (ULID-aware DDL snippets)

---

Store identifiers as ULIDs (CHAR(26) or TEXT). Migrations remain in `backend/migrations/` and Diesel is used as ORM; generate ULIDs in application code rather than database functions.

Example users table snippet:

    CREATE TABLE users (
      id CHAR(26) PRIMARY KEY,
      email CITEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

Example services table snippet:

    CREATE TABLE services (
      id CHAR(26) PRIMARY KEY,
      provider_id CHAR(26) NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      duration_minutes INT NOT NULL,
      price_cents INT NOT NULL,
      currency CHAR(3) NOT NULL DEFAULT 'BRL',
      tags TEXT[],
      metadata JSONB,
      is_published BOOLEAN NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

Appointments/reservations should use the same CHAR(26) id columns and apply SELECT ... FOR UPDATE or a reservations table to avoid double-booking (see booking section in initial spec).

5. Modular monolith layout & runtime notes

---

Repository layout (suggested)

backend/
Cargo.toml (workspace)
crates/
common/
db/
auth/
users/
providers/
services/
bookings/
payments/
notifications/
admin/
migrations/
src/bin/server.rs (binary that wires modules together)

Design principles

- Each module owns its domain types and database access patterns; expose only small public APIs to other modules.
- Share a single DB connection pool and a single telemetry/metrics pipeline across modules.
- Use an in-process event bus (channel-based or async broadcast) to decouple modules when needed; keep events eventual-consistent within the monolith.
- Background work: use an in-process worker pool for light background tasks; for heavier or independent tasks, build a second binary `worker` that reuses the same crates but runs separate runtime (still part of the repository).

Deployment

- Single binary produced and deployed per release. This keeps operations simple while preserving modular code structure.

6. API examples (ULIDs in examples)

---

Create appointment request

    POST /api/v1/appointments
    Authorization: Bearer <token>
    {
      "service_id": "01G6A5T9H1K2X4Z7Y8C0VQ2B3D",
      "start_ts": "2026-04-01T18:00:00-03:00",
      "client_notes": "Prefer Zoom",
      "payment_method_id": "pm_01G7..."
    }

Response 201 (created)

    {
      "id": "01G6A5T9H1K2X4Z7Y8C0VQ2B3E",
      "status": "requested",
      "service_id": "01G6A5T9H1K2X4Z7Y8C0VQ2B3D",
      "start_ts": "2026-04-01T18:00:00-03:00",
      "price_cents": 12000,
      "currency": "BRL"
    }

OAuth code issuance example (valkey)

1. Server generates auth code: `code = ULID()` (e.g. `01G6B...`)
2. Store in valkey: key = `code:01G6B...`, value = JSON {user_id, client_id, redirect_uri, scopes, code_challenge}, TTL = 10m
3. Redirect user to `redirect_uri?code=01G6B...&state=...`

Token exchange validates and atomically deletes the `code:<ULID>` key from valkey.

7. Implementation notes & next steps

---

- Update all Diesel models and types to use `String`/`CHAR(26)` for ID columns and ensure application code uses a ULID generator.
- Implement a small valkey client abstraction in `common/cache/valkey` so modules interact via a typed API: set_key(key, value, ttl), get_and_delete(key) (atomic), get(key), delete(key). Unit-test atomic behavior.
- Auth module: store refresh tokens and other durable tokens in Postgres (hashed), store ephemeral codes in valkey.
- Ensure migrations and sample data generation use server-side ULID generation.
- Build integration tests that include an embedded valkey (or a test instance) to exercise OAuth flows.

# Agents notes and architectural decisions

Initial project scaffolding started. Key decisions:

- Use Rust backend with workspace layout under `backend/` and crates in `backend/crates/`.
- Use ULID for identifiers (see TECHNINAL_SPEC_BACKEND.md).
- Mobile app will be Expo + React Native with TypeScript strict mode.

Repository is private and proprietary — treat contents as internal-only. Do not
publish or share design documents, credentials, or implementation details
outside the organization.

Recent progress (2026-03-04):

- Completed repository skeleton: `README.md`, `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`.
- Created `backend/` and `mobile/` directories with `README.md` files.
- Added `backend/Cargo.toml` workspace and `backend/crates/.gitkeep` placeholder.
- Initial journaling in `journal.txt` and project plan updated (Task 1 set to Done).

Planned next steps:

- Add CI skeleton (lint, format, test runs) and Biome/rustfmt/clippy configuration.
- Scaffold initial backend crates (`common`, `db`, `auth`, etc.) under `backend/crates/`.
- Add a Diesel migrations stub in `backend/migrations/` with initial DDL examples.

Recent edits:

- Added a `common` crate ULID helper and basic logging/config utilities. Also scaffolded an `auth` crate placeholder.
 
Recent edits:

- Added basic `common` crate ULID helper and logging dependencies to `backend/crates/common/Cargo.toml`.
- Completed `db` crate with Diesel schema.rs for users and services tables, using ULID as CHAR(26) and CITEXT for emails.
- Added `src/bin/server.rs` with Axum for HTTP server setup.
- Scaffolded remaining backend crates: users, providers, services, bookings, payments, notifications, admin with basic Cargo.toml and lib.rs placeholders.

Recent edits (2026-03-04):

- Introduced `backend/docker-compose.yml` with Postgres and Valkey services for
  local development, aligning with the valkey-based cache design in
  `TECHNINAL_SPEC_BACKEND.md`.
- Added a CI workflow (`.github/workflows/ci.yml`) that runs Rust fmt/clippy/
  tests for the backend and Biome checks for the mobile app.
- Added `mobile/biome.json` with strict TypeScript rules (including
  `noExplicitAny`) to enforce mobile code quality.
- Expanded developer documentation in `README.md`, `backend/README.md`, and
  `mobile/README.md` to describe required tools, Docker-based dependencies,
  and common commands for backend and mobile workflows.

Recent edits (Task 2 completion):

- Initialized Expo app in `mobile/` with Expo SDK 54 and React Native 0.81.5.
- Installed `@tamagui/core` and `@tamagui/babel-plugin` for UI component library.
- Created `mobile/babel.config.js` with Tamagui babel plugin and reanimated plugin.
- Created `mobile/tamagui.config.ts` with custom esoteric theme tokens:
  - Primary colors: purple/violet palette (#8B5CF6, #A78BFA, #C4B5FD)
  - Accent: amber (#F59E0B)
  - Dark theme background: deep indigo (#0F0D1A)
- Updated `mobile/package.json`: renamed to "esotheric-mobile", added biome lint/format scripts.
- Installed `@biomejs/biome` as dev dependency.
- Fixed biome.json for Biome 2.4.5 compatibility.
- Verified TypeScript strict mode and Biome linting work correctly.

Cache Layer Architecture (Task 5):

- Selected `redis` crate (v0.29) as the Redis/Valkey client library over `fred`:
  - More widely used and battle-tested in the Rust ecosystem
  - Cleaner API for our use case
  - Better documentation and community support
  - Native async support with tokio

- Cache abstraction design in `backend/crates/common/src/cache/`:
  - Trait-based design (`Cache` trait) allows easy swapping between implementations
  - `ValkeyCache`: Production implementation using Redis/Valkey
  - `MockCache`: In-memory implementation for unit testing
  - Both implement the same interface: `set`, `get`, `get_and_delete`, `delete`

- Key implementation details:
  - Uses multiplexed async connections for better performance
  - SETEX command for atomic set-with-TTL (prevents race conditions)
  - GETDEL command (Redis 6.2+) for atomic get-and-delete (critical for OAuth2 auth codes)
  - TTL support tested using tokio's time manipulation (pause/advance)
  - Connection URL from environment variables (VALKEY_URL or REDIS_URL)

- Production deployment considerations:
  - Use `rediss://` URL scheme for TLS encryption
  - Configure authentication via URL (redis://username:password@host:port)
  - Valkey fully compatible with Redis protocol
  - Connection pooling handled internally by redis crate

- Testing strategy:
  - MockCache for fast, deterministic unit tests
  - ValkeyCache integration tests for validation (require running server)
  - All MockCache tests pass with proper TTL verification

Next updates will include OAuth2 server implementation (Task 6).

I'll update this file with more architecture notes and decisions as tasks
progress.

OAuth2 Authorization Server Architecture (Task 6 - COMPLETED):

- Implemented OAuth2 authorization server with Axum handlers:
  - Authorization endpoint: `GET /oauth/authorize` - Issues authorization codes with PKCE
  - Token endpoint: `POST /oauth/token` - Exchanges codes for access tokens, supports refresh_token grant
  - Revocation endpoint: `POST /oauth/revoke` - Token revocation with database updates
  - JWKS endpoint: `GET /.well-known/jwks.json` - Public key distribution for token validation

- Security features implemented:
  - PKCE (Proof Key for Code Exchange) support: S256 and Plain methods
    - S256 recommended for mobile apps (code challenge = SHA256(code_verifier))
    - Prevents authorization code interception attacks
  - Atomic authorization code consumption using GETDEL command
    - Prevents replay attacks by immediately deleting codes after first use
    - 10-minute TTL on all authorization codes stored in Valkey
  - RSA-256 (RS256) for JWT signing
    - Private key for signing, public key for validation
    - JWKS endpoint for external token validation
  - Refresh token security:
    - SHA256 hashing before storage (raw token only returned once to client)
    - 30-day expiration with database-level enforcement
    - Revocation support with database flag
    - Client ID validation on token refresh

- JWT implementation details:
  - Using `jsonwebtoken` crate with `aws_lc_rs` crypto backend
  - Access tokens include claims: sub (user_id), aud, iss, exp, iat, scope, client_id
  - 1-hour default expiration for access tokens
  - JWKS response includes RSA public key in JWK format (kty, alg, use, n, e)

- Database models (`backend/crates/auth/src/db_models.rs`):
  - `RefreshToken` (Queryable): Full database representation with all fields
  - `NewRefreshToken` (Insertable): For creating new refresh tokens
  - Helper functions:
    - `create_refresh_token`: Generates secure random token, hashes it, stores in DB
    - `validate_refresh_token`: Validates token hash against DB (checks expiration, revocation, client_id)
    - `revoke_refresh_token`: Marks token as revoked
    - `revoke_all_user_tokens`: Revokes all tokens for a user (logout all devices)
    - `hash_token`: SHA256 hashing for secure storage
    - `generate_refresh_token`: Generates cryptographically secure random tokens (base64url, 32 bytes)

- Database schema (migrations/0002_create_oauth_tables.sql):
  - `oauth_clients` table: Stores registered OAuth applications
    - client_id, client_secret_hash, redirect_uris (JSONB), allowed_scopes (JSONB)
    - is_confidential flag for distinguishing public vs confidential clients
  - `refresh_tokens` table: Durable refresh token storage
    - token_hash (unique), user_id, client_id, scopes, expires_at, revoked flag
    - Indexed on user_id, token_hash, and expires_at for efficient queries

- AuthState architecture:
  - Holds `JwtService`, `Cache` (for ephemeral data), and optional `DbPool` (for refresh tokens)
  - Constructor `new()` for testing without database
  - Constructor `with_db_pool()` for production with database
  - Allows handlers to work with or without database for flexibility

- Token endpoint implementation details:
  - `authorization_code` grant: Validates code via cache, verifies PKCE, generates access token AND refresh token (stored in DB)
  - `refresh_token` grant: Validates stored refresh token (hash lookup, expiration check, revocation check, client_id match), issues new access token
  - Proper OAuth2 error responses per RFC 6749 (invalid_grant, invalid_request, server_error, etc.)

- Revocation endpoint:
  - Returns 200 OK regardless of whether token existed (security: prevents enumeration)
  - Best-effort revocation (doesn't fail on database errors)
  - Only revokes refresh tokens (access tokens are short-lived and validated via JWT)

- Test coverage:
  - 9 total tests in auth crate (6 integration + 3 unit tests)
  - Full authorization code flow with PKCE
  - Code reuse prevention (should fail on second attempt)
  - TTL expiration handling
  - PKCE verification (success and failure cases)
  - JWT generation and validation
  - JWKS format validation
  - Client ID validation
  - Note: Tests use MockCache and don't require database (libpq linking issue in CI)

- Architectural decisions:
  - Authorization codes stored in Valkey (ephemeral) vs refresh tokens in PostgreSQL (durable)
    - Separation allows different scaling strategies (cache for high-throughput, DB for persistence)
  - MockCache used for fast unit tests without external dependencies
  - ValkeyCache integration tests marked with #[ignore] for optional validation
  - AuthState struct holds JwtService and Cache for easy handler access
  - Handlers return proper OAuth2 error responses per RFC 6749
  - Refresh tokens use SHA256 hashing (not encryption) for one-way security
  - Optional database pool in AuthState allows testing without PostgreSQL

- Future enhancements (optional):
  - Device flow: For devices without browsers (smart TVs, CLI tools)
  - Token introspection: Endpoint for resource servers to validate tokens
  - Client authentication: Validate client_secret for confidential clients
  - Refresh token rotation: Issue new refresh token on each use, revoke old one
  - Token binding: Bind tokens to device/connection for additional security

Task 6 is complete. Next: Task 7 (Users and provider profiles).

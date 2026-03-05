Project plan and implementation TODOs for Esotheric Services marketplace

Reference files:
- REQUIREMENTS.md
- TECHNINAL_SPEC_BACKEND.md

[ DONE ] Task 1: Project initialization & repository layout
- Create repository root with README, LICENSE, CODE_OF_CONDUCT, CONTRIBUTING
- Initialize a Git workspace and branch strategy (main, develop, feature/*)
- Create `backend/` and `mobile/` top-level directories and initial README files
- Add a `backend/Cargo.toml` workspace and `backend/crates/` layout per TECHNINAL_SPEC_BACKEND.md

[ DONE ] Task 2: Development environment & tooling
- Backend: install Rust toolchain, `cargo`, Diesel CLI, PostgreSQL locally or in Docker
- Frontend: install Node.js, Expo CLI, Yarn/PNPM, configure TypeScript strict mode
- Formatting/linting: add Biome config for the mobile app (no `any` rule), add rustfmt and clippy setup
- Add CI pipeline skeleton to run linters, formatters and tests on push/PR

[ DONE ] Task 3: Backend workspace scaffolding
- Created crates: common, db, auth, users, providers, services, bookings, payments, notifications, admin
  - Created `common` and `auth` crate skeletons; added simple logging & config helpers to `common`.
  - Completed db crate with Diesel schema for users and services tables using ULID CHAR(26) and CITEXT.
  - Added `src/bin/server.rs` with basic Axum setup and feature flags for worker binary.
- Implemented shared config and logging in `common/` (structured logs, env-based config)
- Add Diesel setup under `db/` and example migration folder `backend/migrations/` with initial DDL (users, services, appointments)

[ DONE ] Task 4: IDs & storage (ULID)
- Add ULID dependency to `common/` and update models to use `CHAR(26)`/String for IDs
- Update Diesel schema types and migrations to use `CHAR(26)` primary keys as shown in TECHNINAL_SPEC_BACKEND.md
- Create helper utilities to generate ULIDs server-side and tests for deterministic formats

[ DONE ] Task 5: Valkey cache client and ephemeral storage
- Design a small valkey client abstraction in `common/cache/valkey` with API: `set_key`, `get`, `get_and_delete` (atomic), `delete`
- Add unit tests that assert TTL behavior and atomic get-and-delete semantics (use a test instance or in-memory stub)
- Document TLS/auth requirements for production connection

[ DONE ] Task 6: Authentication & OAuth2 server
- Implemented OAuth2 authorization server in `auth/` using Axum handlers (authorization endpoint, token endpoint, revocation)
- Use valkey for ephemeral artifacts (authorization codes, PKCE challenges) and Postgres for durable refresh tokens (hashed)
- Added JWT issuance, JWKS endpoint for public key distribution
- Implemented PKCE flows for mobile/public clients (S256 and Plain methods)
- Added integration tests for the full auth code -> token exchange using the valkey stub
- Implemented refresh token flow with database storage (30-day expiration, SHA256 hashed)
- Implemented token revocation endpoint with database updates
- All OAuth2 flows functional: authorization_code, refresh_token, revocation

[ DONE ] Task 7: Users and provider profiles
- Implement `users/` module: registration, email uniqueness (CITEXT), password hashing, profile updates
- Implement `providers/` module: create provider profile, list services, working hours and availability metadata
- Add admin APIs for provider verification and moderation

[ DONE ] Task 8: Services catalog & publishing
- Implement `services/` module and DDL (see TECHNINAL_SPEC_BACKEND.md services example)
- Provide APIs to create/update/publish/unpublish services, attach tags and metadata
- Add search/filter endpoints (by tag, price range, provider rating)

[ DONE ] Task 9: Bookings & appointment lifecycle
- Implement `bookings/` module to handle create/request/confirm/cancel flows
- Use DB transactions and SELECT ... FOR UPDATE or a reservation table to avoid double-booking
- Integrate payment-intent orchestration: create a provisional booking, hold availability, require payment confirmation to finalize
- Add unit and integration tests that simulate concurrent booking attempts to ensure atomicity

[ DONE ] Task 10: Payments integration
- Choose payment providers to support (Stripe, MercadoPago, PagSeguro) — start with Stripe sandbox for MVP (recommended)
- Implement `payments/` orchestration: create payment intents, webhook handlers, provider commissions and payout placeholders
- Persist payment intents and final settlement metadata in Postgres; ensure idempotent webhook handling

[ TO-DO ] Task 11: Notifications & support
- Implement `notifications/` module with email worker hooks (transactional emails for booking confirmations, reminders)
- Add placeholders for push notifications (Expo push tokens) and worker to dispatch scheduled reminders
- Add simple support contact endpoints and an email-based ticket fallback

[ TO-DO ] Task 12: Frontend (Expo + React Native + Tamagui)
- Initialize Expo app in `mobile/` with TypeScript strict settings and Biome config (for lint/format)
- Install Tamagui and a component theming system reflecting esoteric design (colors, gradients, subtle motion)
- Add screens: Auth (login, signup, PKCE flow), Onboarding, Provider Discovery, Service Details, Booking flow, Profile, Provider Dashboard
- Implement a typed API client to call backend endpoints; ensure ULID strings are handled consistently
- Add animation patterns and theme tokens (stardust-inspired) and ensure performance on low-end devices

[ TO-DO ] Task 13: Auth on mobile (PKCE) & secure storage
- Implement OAuth PKCE flow in Expo: generate code_challenge/verifier, open authorize endpoint, handle redirect, exchange code for tokens
- Store tokens securely (SecureStore / Keychain) and refresh transparently using refresh tokens
- Implement logout and token revocation flows

[ TO-DO ] Task 14: Testing and quality gates
- Backend: unit tests per crate, integration tests exercising DB and valkey flows (use docker-compose for test dependencies)
- Frontend: component and e2e tests (Detox or Cypress/Playwright if web fallback exists)
- CI: run Biome lint/format, TypeScript build, cargo fmt/clippy, and test suites on PRs

[ TO-DO ] Task 15: Dockerization & local dev environment
- Add Dockerfiles for backend and mobile dev container examples (Expo dev inside container if desired)
- Add docker-compose.dev with Postgres and a valkey-compatible cache (Redis or a valkey shim) for local development
- Add `make` targets or npm scripts to simplify common tasks (start-db, start-backend, start-mobile)

[ TO-DO ] Task 16: Observability, metrics and security
- Add structured logging and request tracing in `common/` (optionally OpenTelemetry integration)
- Expose basic metrics endpoint and health checks
- Security: enforce TLS, rotate keys, secure DB credentials, audit logs for auth events

[ TO-DO ] Task 17: Migrations, seed data and sample fixtures
- Create initial Diesel migrations for users, services, bookings, payments, refresh_tokens
- Add seed generator that creates sample providers, services and bookings for development

[ TO-DO ] Task 18: Deploy & release strategy
- Build single backend binary and create a Docker image for deployment
- Create simple deployment recipe (Heroku/GCP/AWS ECS) for early testing; for production recommend k8s or managed container service
- Plan DB backup and valkey availability/replication

[ TO-DO ] Task 19: Documentation and handover
- Document API endpoints (OpenAPI/Swagger) and auth flows (PKCE examples)
- Add developer contribution guide, environment variable references, and runbook for ops

Next steps (immediate):
1) Create repository layout (Task 1) and commit skeleton files
2) Scaffold backend workspace and add Diesel migrations stub (Tasks 2 & 3)
3) Initialize Expo mobile app with TypeScript strict mode and Biome config (Task 12)

Verification steps:
- Run `cargo build` in `backend/` and `expo start` in `mobile/` after scaffolding
- Run linters (Biome) and formatters (rustfmt/biome) in CI

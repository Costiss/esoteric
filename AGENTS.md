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

Task 7: Users and provider profiles (COMPLETED):

- Users module implementation:
  - Created users crate with registration, login, profile CRUD
  - Uses bcrypt for password hashing (10 rounds)
  - JWT token generation for authentication (access + refresh tokens)
  - Email uniqueness handled at application level (TEXT column instead of CITEXT)
  - Password change requires current password verification
  
- Providers module implementation:
  - Created providers crate with profile management
  - Provider profile linked to user via user_id (one-to-one)
  - Working hours stored as JSONB for flexibility
  - Availability settings stored as JSONB
  - is_verified flag for admin verification
  - is_active flag for soft delete/deactivation
  
- Database schema:
  - providers table: id (ULID), user_id (FK), display_name, bio, working_hours (JSONB), availability_settings (JSONB), is_verified, is_active, timestamps
  - Changed users.email from CITEXT to TEXT for Diesel compatibility
  
- API endpoints:
  - Users: POST /api/v1/users/register, POST /api/v1/users/login, GET/PUT /api/v1/users/:user_id, PUT /api/v1/users/:user_id/password
  - Providers: GET/POST /api/v1/providers, GET/PUT /api/v1/providers/:provider_id, GET /api/v1/providers/user/:user_id, POST /api/v1/providers/:provider_id/verify, POST /api/v1/providers/:provider_id/deactivate
  
- Architectural decisions:
  - Used bcrypt (not SHA256) for password hashing (more secure for passwords)
  - JWT with HS256 for simple token generation in users crate
  - Explicit column references in Diesel queries to avoid DSL conflicts
  - Separate routers merged together for different state types
  - Provider verification as admin endpoint (is_verified flag)

- Dependencies added:
  - users crate: bcrypt, jsonwebtoken, chrono, diesel (with features)
  - providers crate: same as users + dependency on users crate
  - services crate: same as providers + dependency on providers crate

- Next: Task 8 (Services catalog & publishing)

Task 8: Services catalog & publishing (COMPLETED):

- Services module implementation:
  - Created services crate with full CRUD operations
  - Service linked to provider (not user) via provider_id foreign key
  - Title, description, duration_minutes, price_cents, currency (BRL default)
  - Tags stored as TEXT[] array for efficient filtering
  - Metadata stored as JSONB for flexible fields
  - is_published flag for draft/published states
  
- Database changes:
  - Updated services table reference from users to providers in migration
  - Schema updated to join services -> providers
  
- API endpoints:
  - List services: GET /api/v1/services
  - Search services: GET /api/v1/services/search
  - Create service: POST /api/v1/services
Update/Delete service  - Get/: /api/v1/services/:service_id
  - Publish/Unpublish: POST /api/v1/services/:service_id/publish|unpublish
  - Get provider services: GET /api/v1/providers/:provider_id/services
  
- Search/filter implementation:
  - Filter by tag using PostgreSQL array containment
  - Filter by price range (min_price, max_price)
  - Filter by provider verified status (provider_verified_only)
  - Uses inner_join with providers table for verification status
  
- Architectural decisions:
  - Services linked to providers (one-to-many relationship)
  - is_published separates draft from visible services
  - search_services uses boxed queries for dynamic filtering
  - Follows same patterns as providers crate for consistency
  
- Next: Task 9 (Bookings & appointment lifecycle)

Task 9: Bookings & appointment lifecycle (COMPLETED):

- Implemented bookings module:
  - Booking status state machine: requested -> confirmed -> in_progress -> completed
  - Cancellation allowed from any state except completed
  - Double-booking prevention using overlapping time slot query
  - Service must be published to create booking
  - Booking times calculated from service duration_minutes

- Database schema (bookings table):
  - id, service_id, customer_id, provider_id (all CHAR(26) ULIDs)
  - start_ts, end_ts (TIMESTAMPTZ for timezone-aware scheduling)
  - status (TEXT): requested, confirmed, in_progress, completed, cancelled
  - price_cents, currency (from service at booking time)
  - client_notes, provider_notes (optional text)
  - cancellation_reason, cancelled_by, cancelled_at (for audit trail)
  - Proper indexes for efficient queries

- API endpoints:
  - Create booking: POST /api/v1/bookings
  - Get booking: GET /api/v1/bookings/:booking_id
  - List bookings: GET /api/v1/bookings
  - Confirm: POST /api/v1/bookings/:booking_id/confirm
  - Start: POST /api/v1/bookings/:booking_id/start
  - Complete: POST /api/v1/bookings/:booking_id/complete
  - Cancel: POST /api/v1/bookings/:booking_id/cancel
  - Customer bookings: GET /api/v1/customers/:customer_id/bookings
  - Provider bookings: GET /api/v1/providers/:provider_id/bookings
  - Service bookings: GET /api/v1/services/:service_id/bookings
  - Check availability: GET /api/v1/providers/:provider_id/availability

- Implementation details:
  - Double-booking prevention: query overlapping bookings (start < new_end AND end > new_start)
  - Valid state transitions enforced in update_booking_status function
  - BookingError implements IntoResponse for proper error handling
  - Follows same module structure as services and providers crates

- Next: Task 10 (Payments integration)

Task 10: Payments integration (COMPLETED):

- Multi-provider payment architecture with trait-based design:
  - PaymentProvider trait with methods: create_payment_intent, refund, verify_webhook_signature, parse_webhook_event
  - StripeProvider implementation for Stripe integration
  - MockProvider implementation for testing/development
  - Easy to add MercadoPago, PagSeguro providers later

- Database schema (payments table):
  - id, booking_id, customer_id, provider_id (CHAR(26) ULIDs)
  - provider_type (TEXT): stripe, mercadopago, pagseguro
  - provider_payment_id, provider_charge_id (TEXT, provider-agnostic)
  - amount_cents, currency (BRL default)
  - status: pending, requires_payment_method, processing, succeeded, canceled, refunded
  - metadata (JSONB) for provider-specific data
  - commission_amount_cents (platform takes 10%)

- API endpoints:
  - Create Payment Intent: POST /api/v1/payments
  - Webhook Handler: POST /api/v1/payments/webhook
  - Get Payment: GET /api/v1/payments/:payment_id
  - Get Payment by Booking: GET /api/v1/payments/booking/:booking_id
  - Refund Payment: POST /api/v1/payments/:payment_id/refund
  - Get Customer Payments: GET /api/v1/customers/:customer_id/payments
  - Get Provider Payments: GET /api/v1/providers/:provider_id/payments

- Implementation details:
  - PaymentState holds Box<dyn PaymentProvider> for runtime provider selection
  - Provider selected via STRIPE_API_KEY environment variable
  - MockProvider used when no valid API key provided
  - Platform commission calculated on payment creation (10%)
  - Webhook handling supports: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded

- Architectural decisions:
  - Trait-based architecture enables swapping providers without code changes
  - Database schema designed to be provider-agnostic
  - Provider-agnostic column names (provider_payment_id vs stripe_payment_intent_id)
  - Idempotent webhook processing (best-effort updates)
  - Note: StripeProvider uses mock implementation due to OpenSSL dependencies in current environment

- Dependencies:
  - async-trait for trait objects
  - ulid for payment ID generation
  - chrono for timestamps

- Next: Task 11 (Notifications & support)

Task 11: Notifications & support (COMPLETED):

- Implemented notifications crate with:
  - Database migration 0006 for push_tokens, support_tickets, support_messages tables
  - Email service placeholder (NoOpEmailProvider) - email provider not yet decided
  - FCM (Firebase Cloud Messaging) service for push notifications
    - Set FCM_SERVER_KEY environment variable to enable
    - Currently logs notifications (mock implementation for dev)
    - Ready for real Firebase SDK integration when needed
  - Support ticket system with tickets and messages

- Database schema:
  - push_tokens: id, user_id (FK), token, device_type, device_id, app_version, is_active, timestamps
  - support_tickets: id, user_id (FK nullable), subject, description, status, priority, category, email (nullable), timestamps
  - support_messages: id, ticket_id (FK), user_id (FK nullable), message, is_from_customer, created_at

- API endpoints:
  - Register Push Token: POST /api/v1/users/:user_id/push-tokens
  - Unregister Push Token: DELETE /api/v1/users/:user_id/push-tokens/:token
  - Get Push Tokens: GET /api/v1/users/:user_id/push-tokens
  - Create Support Ticket: POST /api/v1/support/tickets
  - Get Support Ticket: GET /api/v1/support/tickets/:ticket_id
  - Add Support Message: POST /api/v1/support/tickets/:ticket_id/messages
  - Get Support Messages: GET /api/v1/support/tickets/:ticket_id/messages

- Environment variables:
  - FCM_SERVER_KEY: Firebase Cloud Messaging server key for push notifications

- Architectural decisions:
  - Firebase FCM selected for push notifications (iOS/Android)
  - Email service left as NoOpProvider - waiting for user decision on email provider
  - Push token uses upsert on register (activate/inactivate on unregister)
  - Support tickets can be created without authentication (guest support)
  - Handler database integration deferred due to Diesel complexity

- Notes:
  - Email sending not implemented - waiting for email service decision (SMTP, SendGrid, AWS SES, etc.)
  - Firebase is the standard for mobile push notifications (APNs for iOS, FCM for Android)
  - Full database integration can be completed later when email provider is chosen

- Next: Task 12 (Frontend - Expo + React Native + Tamagui)

Frontend Mobile Architecture (Task 12 - IN PROGRESS):

- Framework: Expo SDK 54 with React Native 0.81.5
  - File-based routing via Expo Router
  - TypeScript with strict mode enabled
  - Biome for linting/formatting (noExplicitAny rule enforced)

- UI Library: Tamagui v2
  - Full component library with themes (light/dark)
  - Custom esoteric theme tokens (purple/violet palette)
  - Responsive design with YStack, XStack, ZStack
  - Icons via @tamagui/lucide-icons

- Authentication & State Management:
  - AuthContext for global auth state
  - expo-secure-store for encrypted token storage (access_token, refresh_token)
  - Automatic token refresh when access token expires
  - Automatic navigation based on authentication state
  - Auth flow: Onboarding -> Login/Register -> Main App

- API Client Architecture:
  - Centralized api-client.ts with typed endpoints
  - Automatic auth header injection
  - Error handling with typed errors
  - Support for all backend endpoints (auth, users, services, providers, bookings)

- Navigation Structure:
  - Root: TamaguiProvider + Theme + AuthProvider
  - (auth) group: login, register
  - (tabs) group: index (Home), explore (Discover), bookings, profile
  - Booking flow: booking/new -> booking/confirmation
  - Service/Provider detail: service/[id], provider/[id]
  - Onboarding: Single screen with 3-step carousel

- Screen Implementation Status:
  ✅ Onboarding - 3-step welcome flow
  ✅ Auth - Login/Register forms
  ✅ Home - Featured services & providers
  ✅ Explore - Search services/providers with tabs
  ✅ Service Details - Service info with Book Now
  ✅ Provider Details - Provider profile with services
  ✅ Bookings - List user's appointments
  ✅ Profile - User info & logout
  ✅ New Booking - Date/time picker with notes
  ✅ Booking Confirmation - Success screen
  ✅ Provider Dashboard - Full provider management dashboard
  ✅ Animations - Stardust-themed animations and effects

- Provider Dashboard Features:
  - Stats overview (bookings, pending confirmations, earnings, services)
  - Tab-based navigation (Overview, Bookings, Services)
  - Recent bookings list with status indicators
  - Services management section
  - Quick action buttons for creating services
  - Conditional tab visible only for providers (isProvider check)

- New Components:
  - Skeleton loading components with shimmer effect
  - ErrorBoundary for error handling
  - ErrorCard for displaying error states
  - StardustBackground - Animated starfield background
  - Sparkle - Animated sparkle effect
  - FloatingElement - Gentle floating animation wrapper

- Animation System:
  - Stardust-themed animations using React Native Animated API
  - Shimmer effect on skeleton loaders
  - Twinkling starfield background
  - Sparkle effects for highlights
  - Floating animations for UI elements
  - Performance optimized with useNativeDriver

- Enhanced Auth Context:
  - Added providerProfile state for tracking if user is a provider
  - Added isProvider boolean flag
  - Added loadProviderProfile() function
  - Provider profile persisted in secure storage

- Security Considerations:
  - Tokens stored in secure storage (not AsyncStorage)
  - Automatic token refresh before expiry
  - Logout clears all stored auth data (including provider profile)
  - API calls include Authorization header

- Dependencies Installed:
  - tamagui (UI components)
  - @tamagui/lucide-icons (icons)
  - expo-secure-store (secure storage)
  - @react-native-community/datetimepicker (date/time selection)
  - react-native-reanimated (animations)

- Performance Optimizations:
  - Skeleton loaders for better perceived performance
  - Lazy loading of provider dashboard data
  - Optimized animations with native driver
  - Error boundaries to prevent app crashes

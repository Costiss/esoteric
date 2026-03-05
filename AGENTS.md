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

Next updates will include decisions about the cache layer (valkey vs Redis
shim) and CI configuration.

I'll update this file with more architecture notes and decisions as tasks
progress.

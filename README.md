Esotheric Services marketplace (private repository)

This repo contains the backend (Rust + Axum + Diesel) and mobile app (Expo +
React Native + Tamagui) for the Esotheric marketplace.

This repository is private and contains proprietary information.

See `PLAN.md` for roadmap and `REQUIREMENTS.md` / `TECHNINAL_SPEC_BACKEND.md`
for high-level design.

## Development environment

Install the following tools locally:

- Rust toolchain (`rustup`, `cargo`)
- Node.js (>= 20) and npm
- PNPM or Yarn (optional, for mobile app workflows)
- Expo CLI: `npm install -g @expo/cli`
- Diesel CLI (for managing SQL migrations):
  - `cargo install diesel_cli --no-default-features --features postgres`

You will also need Docker if you want to run Postgres and Valkey locally.

## Local services (Postgres + Valkey)

From `backend/` you can start local dependencies with Docker Compose:

```sh
cd backend
docker compose up -d
```

This brings up:

- `db`: Postgres on `localhost:5432` (user/password/db: `postgres`)
- `valkey`: Valkey on `localhost:6379`

Stop them with:

```sh
cd backend
docker compose down
```

## Backend workspace

Backend code lives under `backend/` as a Rust workspace. Common commands:

```sh
cd backend

# Format and lint
cargo fmt
cargo clippy -- -D warnings

# Run tests
cargo test

# Build the workspace
cargo build
```

The main server binary is in `backend/src/bin/server.rs`. Once the database is
running and migrations are applied, you will be able to start the HTTP server
with:

```sh
cd backend
cargo run --bin server
```

## Mobile app

Mobile code lives under `mobile/`. The Expo app has not been initialized yet;
PLAN Task 12 tracks that work.

Once the Expo project exists, typical commands will look like:

```sh
cd mobile
npm install
npx expo start
```

Biome is configured in `mobile/biome.json` and is run in CI. Locally you can
run:

```sh
cd mobile
npx biome check .
```

## Continuous integration

GitHub Actions workflow in `.github/workflows/ci.yml` runs on pushes and pull
requests against `main` and `develop`:

- Backend job: `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test`
- Mobile job: `npm ci` then `npx biome check . --apply-unsafe`

Keep these jobs green when adding new code.

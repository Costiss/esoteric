Backend Rust workspace for Esotheric.

Structure:
- `crates/`: domain crates (`common`, `db`, `auth`, `users`, ...)
- `migrations/`: Diesel SQL migrations
- `Cargo.toml`: workspace definition and top-level binary dependencies

## Prerequisites

- Rust toolchain installed via `rustup`
- Diesel CLI installed with Postgres support:

```sh
cargo install diesel_cli --no-default-features --features postgres
```

## Local database and cache

Use the provided Docker Compose file to run Postgres and Valkey locally:

```sh
cd backend
docker compose up -d
```

Environment defaults (can be overridden as needed):

- Postgres: `postgres://postgres:postgres@localhost:5432/postgres`
- Valkey: `redis://localhost:6379`

## Migrations

Migrations live in `backend/migrations/`. To apply them to your local
Postgres instance (with Docker services running):

```sh
cd backend
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/postgres"
diesel migration run
```

You can revert the last migration with:

```sh
diesel migration revert
```

## Building and testing

Common commands from `backend/`:

```sh
# Format and lint
cargo fmt
cargo clippy -- -D warnings

# Run tests
cargo test

# Build the workspace
cargo build
```

## Running the server

The main HTTP server entrypoint is `src/bin/server.rs`. With the database
running and `DATABASE_URL` set, start the server via:

```sh
cd backend
cargo run --bin server
```

The server will use helpers from the `common` crate for logging and config.

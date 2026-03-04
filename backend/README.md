Backend Rust workspace for Esotheric.

Structure:
- crates/: domain crates (common, db, auth, users, ...)
- migrations/: Diesel SQL migrations
- Cargo.toml: workspace definition

Run `cargo build` from `backend/` to compile the workspace.

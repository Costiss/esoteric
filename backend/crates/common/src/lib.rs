//! Common utilities and types for the backend workspace.

use std::env;

pub fn ulid_new() -> String {
    // Simple wrapper that returns a new ULID string
    ulid::Ulid::new().to_string()
}

/// Initialize a simple env_logger-based logger.
pub fn init_logging() {
    // Respect RUST_LOG if set, otherwise default to info
    if env::var("RUST_LOG").is_err() {
        env::set_var("RUST_LOG", "info");
    }
    env_logger::init();
}

/// Simple environment-based config holder. Expand later as needed.
pub struct Config {
    pub database_url: Option<String>,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL").ok(),
        }
    }
}

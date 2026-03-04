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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ulid_new_length() {
        let ulid = ulid_new();
        assert_eq!(ulid.len(), 26);
    }

    #[test]
    fn test_ulid_new_unique() {
        let ulid1 = ulid_new();
        let ulid2 = ulid_new();
        assert_ne!(ulid1, ulid2);
    }

    #[test]
    fn test_ulid_new_alphanumeric() {
        let ulid = ulid_new();
        assert!(ulid.chars().all(|c| c.is_alphanumeric()));
    }
}

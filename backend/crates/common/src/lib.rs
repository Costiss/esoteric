//! Common utilities and types for the backend workspace.

pub mod cache;

use std::env;

pub fn ulid_new() -> String {
    ulid::Ulid::new().to_string()
}

pub fn init_logging() {
    if env::var("RUST_LOG").is_err() {
        env::set_var("RUST_LOG", "info");
    }
    env_logger::init();
}

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

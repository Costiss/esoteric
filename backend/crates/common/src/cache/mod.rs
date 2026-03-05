//! Cache abstraction for ephemeral storage (Valkey/Redis).
//!
//! Provides a trait-based cache interface for storing ephemeral data like
//! authorization codes, PKCE challenges, and session tokens.

mod mock;
mod valkey;

pub use mock::MockCache;
pub use valkey::ValkeyCache;

use async_trait::async_trait;
use std::time::Duration;
use thiserror::Error;

/// Errors that can occur during cache operations.
#[derive(Debug, Error)]
pub enum CacheError {
    #[error("Connection error: {0}")]
    Connection(String),

    #[error("Command error: {0}")]
    Command(String),

    #[error("Serialization error: {0}")]
    Serialization(String),
}

/// Cache trait for ephemeral key-value storage with TTL support.
///
/// All implementations must support atomic operations and thread-safe access.
#[async_trait]
pub trait Cache: Send + Sync {
    /// Set a key-value pair with the specified TTL.
    async fn set(&self, key: &str, value: &str, ttl: Duration) -> Result<(), CacheError>;

    /// Get a value by key. Returns None if the key doesn't exist or has expired.
    async fn get(&self, key: &str) -> Result<Option<String>, CacheError>;

    /// Atomically get and delete a value by key.
    /// Returns None if the key doesn't exist or has expired.
    async fn get_and_delete(&self, key: &str) -> Result<Option<String>, CacheError>;

    /// Delete a key from the cache.
    async fn delete(&self, key: &str) -> Result<(), CacheError>;
}

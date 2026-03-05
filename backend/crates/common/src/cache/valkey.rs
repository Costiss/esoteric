//! Valkey/Redis cache implementation using the redis crate.

use super::{Cache, CacheError};
use redis::{AsyncCommands, Client};
use std::env;
use std::time::Duration;

/// Valkey cache client configuration.
pub struct ValkeyConfig {
    pub url: String,
}

impl ValkeyConfig {
    /// Create configuration from environment variables.
    ///
    /// Looks for VALKEY_URL or REDIS_URL, defaults to localhost.
    ///
    /// Production requirements:
    /// - Use TLS (rediss:// URL scheme) for secure connections
    /// - Configure authentication via URL (e.g., redis://username:password@host:port)
    /// - Use connection pooling appropriate for your load
    pub fn from_env() -> Self {
        let url = env::var("VALKEY_URL")
            .or_else(|_| env::var("REDIS_URL"))
            .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
        Self { url }
    }
}

/// Valkey/Redis cache implementation.
pub struct ValkeyCache {
    client: Client,
}

impl ValkeyCache {
    /// Create a new ValkeyCache with the given configuration.
    pub fn new(config: ValkeyConfig) -> Result<Self, CacheError> {
        let client = Client::open(config.url).map_err(|e| {
            CacheError::Connection(format!("Failed to create client: {}", e))
        })?;

        Ok(Self { client })
    }

    /// Create a new ValkeyCache from environment variables.
    pub fn from_env() -> Result<Self, CacheError> {
        Self::new(ValkeyConfig::from_env())
    }

    /// Get a multiplexed async connection.
    async fn get_conn(&self) -> Result<redis::aio::MultiplexedConnection, CacheError> {
        self.client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| CacheError::Connection(format!("Failed to get connection: {}", e)))
    }
}

#[async_trait::async_trait]
impl Cache for ValkeyCache {
    async fn set(&self, key: &str, value: &str, ttl: Duration) -> Result<(), CacheError> {
        let mut conn = self.get_conn().await?;
        let ttl_secs = ttl.as_secs() as u64;

        conn.set_ex::<_, _, ()>(key, value, ttl_secs)
            .await
            .map_err(|e| CacheError::Command(format!("SET EX failed: {}", e)))?;

        Ok(())
    }

    async fn get(&self, key: &str) -> Result<Option<String>, CacheError> {
        let mut conn = self.get_conn().await?;

        let result: Option<String> = conn
            .get(key)
            .await
            .map_err(|e| CacheError::Command(format!("GET failed: {}", e)))?;

        Ok(result)
    }

    async fn get_and_delete(&self, key: &str) -> Result<Option<String>, CacheError> {
        let mut conn = self.get_conn().await?;

        // Use Redis GETDEL command (available since Redis 6.2)
        // This atomically gets and deletes the key
        let result: Option<String> = redis::cmd("GETDEL")
            .arg(key)
            .query_async(&mut conn)
            .await
            .map_err(|e| CacheError::Command(format!("GETDEL failed: {}", e)))?;

        Ok(result)
    }

    async fn delete(&self, key: &str) -> Result<(), CacheError> {
        let mut conn = self.get_conn().await?;

        conn.del::<_, ()>(key)
            .await
            .map_err(|e| CacheError::Command(format!("DEL failed: {}", e)))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // These tests require a running Redis/Valkey instance
    // Run with: cargo test --features integration-tests
    // Or use the MockCache for unit tests

    #[tokio::test]
    #[ignore = "requires redis/valkey server"]
    async fn test_valkey_set_and_get() {
        let cache = ValkeyCache::new(ValkeyConfig {
            url: "redis://127.0.0.1:6379".to_string(),
        })
        .expect("Failed to create cache");

        cache
            .set("test_key", "test_value", Duration::from_secs(60))
            .await
            .expect("Failed to set");

        let result = cache.get("test_key").await.expect("Failed to get");
        assert_eq!(result, Some("test_value".to_string()));

        // Cleanup
        cache.delete("test_key").await.expect("Failed to delete");
    }

    #[tokio::test]
    #[ignore = "requires redis/valkey server"]
    async fn test_valkey_get_and_delete() {
        let cache = ValkeyCache::new(ValkeyConfig {
            url: "redis://127.0.0.1:6379".to_string(),
        })
        .expect("Failed to create cache");

        cache
            .set("test_key2", "test_value2", Duration::from_secs(60))
            .await
            .expect("Failed to set");

        let result = cache
            .get_and_delete("test_key2")
            .await
            .expect("Failed to get_and_delete");
        assert_eq!(result, Some("test_value2".to_string()));

        // Verify it's deleted
        let result = cache.get("test_key2").await.expect("Failed to get");
        assert_eq!(result, None);
    }

    #[tokio::test]
    #[ignore = "requires redis/valkey server"]
    async fn test_valkey_ttl() {
        let cache = ValkeyCache::new(ValkeyConfig {
            url: "redis://127.0.0.1:6379".to_string(),
        })
        .expect("Failed to create cache");

        cache
            .set("ttl_key", "ttl_value", Duration::from_secs(1))
            .await
            .expect("Failed to set");

        // Wait for expiration
        tokio::time::sleep(Duration::from_secs(2)).await;

        let result = cache.get("ttl_key").await.expect("Failed to get");
        assert_eq!(result, None);

        // Cleanup (in case TTL didn't work)
        let _: Result<(), _> = cache.delete("ttl_key").await;
    }
}

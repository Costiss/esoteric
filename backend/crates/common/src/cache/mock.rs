//! In-memory mock cache implementation for testing.

use super::{Cache, CacheError};
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tokio::time::Instant;

/// Entry stored in the mock cache with expiration time.
struct CacheEntry {
    value: String,
    expires_at: Instant,
}

impl CacheEntry {
    fn new(value: String, ttl: Duration) -> Self {
        Self {
            value,
            expires_at: Instant::now() + ttl,
        }
    }

    fn is_expired(&self) -> bool {
        Instant::now() >= self.expires_at
    }
}

/// In-memory mock cache for testing purposes.
pub struct MockCache {
    store: Arc<RwLock<HashMap<String, CacheEntry>>>,
}

impl MockCache {
    /// Create a new empty mock cache.
    pub fn new() -> Self {
        Self {
            store: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Remove expired entries from the cache.
    #[allow(dead_code)]
    async fn cleanup_expired(&self) {
        let mut store = self.store.write().await;
        store.retain(|_, entry| !entry.is_expired());
    }
}

impl Default for MockCache {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl Cache for MockCache {
    async fn set(&self, key: &str, value: &str, ttl: Duration) -> Result<(), CacheError> {
        let mut store = self.store.write().await;
        store.insert(key.to_string(), CacheEntry::new(value.to_string(), ttl));
        Ok(())
    }

    async fn get(&self, key: &str) -> Result<Option<String>, CacheError> {
        let store = self.store.read().await;
        match store.get(key) {
            Some(entry) if !entry.is_expired() => Ok(Some(entry.value.clone())),
            _ => Ok(None),
        }
    }

    async fn get_and_delete(&self, key: &str) -> Result<Option<String>, CacheError> {
        let mut store = self.store.write().await;
        match store.remove(key) {
            Some(entry) if !entry.is_expired() => Ok(Some(entry.value)),
            _ => Ok(None),
        }
    }

    async fn delete(&self, key: &str) -> Result<(), CacheError> {
        let mut store = self.store.write().await;
        store.remove(key);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::time::{advance, pause};

    #[tokio::test]
    async fn test_set_and_get() {
        let cache = MockCache::new();
        cache
            .set("key1", "value1", Duration::from_secs(60))
            .await
            .unwrap();

        let result = cache.get("key1").await.unwrap();
        assert_eq!(result, Some("value1".to_string()));
    }

    #[tokio::test]
    async fn test_get_missing_key() {
        let cache = MockCache::new();
        let result = cache.get("missing").await.unwrap();
        assert_eq!(result, None);
    }

    #[tokio::test]
    async fn test_ttl_expiration() {
        pause();

        let cache = MockCache::new();
        cache
            .set("key1", "value1", Duration::from_secs(10))
            .await
            .unwrap();

        // Key should exist before expiration
        let result = cache.get("key1").await.unwrap();
        assert_eq!(result, Some("value1".to_string()));

        // Advance time past the TTL
        advance(Duration::from_secs(11)).await;

        // Key should be expired now
        let result = cache.get("key1").await.unwrap();
        assert_eq!(result, None);
    }

    #[tokio::test]
    async fn test_get_and_delete() {
        let cache = MockCache::new();
        cache
            .set("key1", "value1", Duration::from_secs(60))
            .await
            .unwrap();

        let result = cache.get_and_delete("key1").await.unwrap();
        assert_eq!(result, Some("value1".to_string()));

        let result = cache.get("key1").await.unwrap();
        assert_eq!(result, None);
    }

    #[tokio::test]
    async fn test_get_and_delete_missing_key() {
        let cache = MockCache::new();
        let result = cache.get_and_delete("missing").await.unwrap();
        assert_eq!(result, None);
    }

    #[tokio::test]
    async fn test_get_and_delete_expired_key() {
        pause();

        let cache = MockCache::new();
        cache
            .set("key1", "value1", Duration::from_secs(10))
            .await
            .unwrap();

        // Key should exist before expiration
        let result = cache.get("key1").await.unwrap();
        assert_eq!(result, Some("value1".to_string()));

        // Advance time past the TTL
        advance(Duration::from_secs(11)).await;

        // Key should be expired, so get_and_delete should return None
        let result = cache.get_and_delete("key1").await.unwrap();
        assert_eq!(result, None);
    }

    #[tokio::test]
    async fn test_delete() {
        let cache = MockCache::new();
        cache
            .set("key1", "value1", Duration::from_secs(60))
            .await
            .unwrap();

        cache.delete("key1").await.unwrap();

        let result = cache.get("key1").await.unwrap();
        assert_eq!(result, None);
    }

    #[tokio::test]
    async fn test_delete_missing_key() {
        let cache = MockCache::new();
        cache.delete("missing").await.unwrap();
    }
}

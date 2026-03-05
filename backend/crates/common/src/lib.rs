//! Common utilities and types for the backend workspace.

pub mod cache;

use std::env;
use std::panic;
use tracing::{error, info};
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

pub fn ulid_new() -> String {
    ulid::Ulid::new().to_string()
}

pub fn init_logging() {
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    let log_dir = env::var("LOG_DIR").unwrap_or_else(|_| "logs".to_string());

    let file_appender = RollingFileAppender::new(Rotation::DAILY, &log_dir, "esotheric.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    let file_layer = fmt::layer()
        .with_writer(non_blocking)
        .with_ansi(false)
        .with_target(true)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true);

    let stdout_layer = fmt::layer()
        .with_writer(std::io::stdout)
        .with_ansi(true)
        .with_target(false)
        .with_thread_ids(false);

    tracing_subscriber::registry()
        .with(env_filter)
        .with(file_layer)
        .with(stdout_layer)
        .init();

    panic::set_hook(Box::new(|panic_info| {
        let location = panic_info
            .location()
            .map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column()))
            .unwrap_or_else(|| "unknown".to_string());

        let message = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "Unknown panic".to_string()
        };

        error!(
            location = %location,
            message = %message,
            "Application panic occurred"
        );
    }));

    info!("Logging initialized, log directory: {}", log_dir);
}

pub fn generate_request_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

pub struct Config {
    pub database_url: Option<String>,
    pub valkey_url: Option<String>,
    pub log_level: Option<String>,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL").ok(),
            valkey_url: env::var("VALKEY_URL")
                .or_else(|_| env::var("REDIS_URL"))
                .ok(),
            log_level: env::var("LOG_LEVEL").ok(),
        }
    }
}

pub mod metrics {
    use std::collections::HashMap;
    use std::sync::atomic::{AtomicU64, Ordering};
    use std::sync::Arc;
    use tokio::sync::RwLock;

    #[derive(Debug, Clone)]
    pub struct Metrics {
        pub http_requests: Arc<AtomicU64>,
        pub http_requests_by_method: Arc<RwLock<HashMap<String, Arc<AtomicU64>>>>,
        pub http_requests_by_status: Arc<RwLock<HashMap<u16, Arc<AtomicU64>>>>,
        pub auth_logins: Arc<AtomicU64>,
        pub auth_token_refreshes: Arc<AtomicU64>,
        pub auth_failures: Arc<AtomicU64>,
        pub bookings_created: Arc<AtomicU64>,
        pub payments_created: Arc<AtomicU64>,
    }

    impl Default for Metrics {
        fn default() -> Self {
            Self::new()
        }
    }

    impl Metrics {
        pub fn new() -> Self {
            Self {
                http_requests: Arc::new(AtomicU64::new(0)),
                http_requests_by_method: Arc::new(RwLock::new(HashMap::new())),
                http_requests_by_status: Arc::new(RwLock::new(HashMap::new())),
                auth_logins: Arc::new(AtomicU64::new(0)),
                auth_token_refreshes: Arc::new(AtomicU64::new(0)),
                auth_failures: Arc::new(AtomicU64::new(0)),
                bookings_created: Arc::new(AtomicU64::new(0)),
                payments_created: Arc::new(AtomicU64::new(0)),
            }
        }

        pub fn inc_http_request(&self, method: &str, status: u16) {
            self.http_requests.fetch_add(1, Ordering::Relaxed);

            let method_counter = {
                let mut map = self.http_requests_by_method.blocking_write();
                map.entry(method.to_string())
                    .or_insert_with(|| Arc::new(AtomicU64::new(0)))
                    .clone()
            };
            method_counter.fetch_add(1, Ordering::Relaxed);

            let status_counter = {
                let mut map = self.http_requests_by_status.blocking_write();
                map.entry(status)
                    .or_insert_with(|| Arc::new(AtomicU64::new(0)))
                    .clone()
            };
            status_counter.fetch_add(1, Ordering::Relaxed);
        }

        pub fn inc_auth_login(&self) {
            self.auth_logins.fetch_add(1, Ordering::Relaxed);
        }

        pub fn inc_auth_token_refresh(&self) {
            self.auth_token_refreshes.fetch_add(1, Ordering::Relaxed);
        }

        pub fn inc_auth_failure(&self) {
            self.auth_failures.fetch_add(1, Ordering::Relaxed);
        }

        pub fn inc_bookings_created(&self) {
            self.bookings_created.fetch_add(1, Ordering::Relaxed);
        }

        pub fn inc_payments_created(&self) {
            self.payments_created.fetch_add(1, Ordering::Relaxed);
        }

        pub fn to_json(&self) -> String {
            let http_requests = self.http_requests.load(Ordering::Relaxed);

            let method_counts = {
                let map = self.http_requests_by_method.blocking_read();
                map.iter()
                    .map(|(k, v)| format!("\"{}\": {}", k, v.load(Ordering::Relaxed)))
                    .collect::<Vec<_>>()
                    .join(", ")
            };

            let status_counts = {
                let map = self.http_requests_by_status.blocking_read();
                map.iter()
                    .map(|(k, v)| format!("\"{}\": {}", k, v.load(Ordering::Relaxed)))
                    .collect::<Vec<_>>()
                    .join(", ")
            };

            format!(
                r#"{{
  "http_requests": {{
    "total": {},
    "by_method": {{{}}},
    "by_status": {{{}}}
  }},
  "auth": {{
    "logins": {},
    "token_refreshes": {},
    "failures": {}
  }},
  "business": {{
    "bookings_created": {},
    "payments_created": {}
  }}
}}"#,
                http_requests,
                method_counts,
                status_counts,
                self.auth_logins.load(Ordering::Relaxed),
                self.auth_token_refreshes.load(Ordering::Relaxed),
                self.auth_failures.load(Ordering::Relaxed),
                self.bookings_created.load(Ordering::Relaxed),
                self.payments_created.load(Ordering::Relaxed)
            )
        }
    }
}

pub mod audit {
    use chrono::{DateTime, Utc};
    use serde::{Deserialize, Serialize};
    use std::collections::VecDeque;
    use std::sync::Arc;
    use tokio::sync::RwLock;

    const MAX_AUDIT_ENTRIES: usize = 1000;

    #[derive(Debug, Clone, Serialize, Deserialize)]
    pub struct AuditEvent {
        pub id: String,
        pub timestamp: DateTime<Utc>,
        pub event_type: String,
        pub user_id: Option<String>,
        pub client_id: Option<String>,
        pub ip_address: Option<String>,
        pub user_agent: Option<String>,
        pub success: bool,
        pub details: Option<String>,
    }

    #[derive(Clone)]
    pub struct AuditLogger {
        events: Arc<RwLock<VecDeque<AuditEvent>>>,
    }

    impl Default for AuditLogger {
        fn default() -> Self {
            Self::new()
        }
    }

    impl AuditLogger {
        pub fn new() -> Self {
            Self {
                events: Arc::new(RwLock::new(VecDeque::with_capacity(MAX_AUDIT_ENTRIES))),
            }
        }

        pub async fn log(&self, event: AuditEvent) {
            let mut events = self.events.write().await;
            if events.len() >= MAX_AUDIT_ENTRIES {
                events.pop_front();
            }
            events.push_back(event);
        }

        pub async fn get_recent(&self, limit: usize) -> Vec<AuditEvent> {
            let events = self.events.read().await;
            events.iter().rev().take(limit).cloned().collect()
        }

        pub async fn get_by_user(&self, user_id: &str, limit: usize) -> Vec<AuditEvent> {
            let events = self.events.read().await;
            events
                .iter()
                .filter(|e| e.user_id.as_deref() == Some(user_id))
                .rev()
                .take(limit)
                .cloned()
                .collect()
        }
    }

    pub fn create_audit_event(
        event_type: &str,
        user_id: Option<&str>,
        client_id: Option<&str>,
        ip_address: Option<&str>,
        user_agent: Option<&str>,
        success: bool,
        details: Option<&str>,
    ) -> AuditEvent {
        AuditEvent {
            id: crate::ulid_new(),
            timestamp: Utc::now(),
            event_type: event_type.to_string(),
            user_id: user_id.map(String::from),
            client_id: client_id.map(String::from),
            ip_address: ip_address.map(String::from),
            user_agent: user_agent.map(String::from),
            success,
            details: details.map(String::from),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::audit::{create_audit_event, AuditEvent, AuditLogger};
    use crate::metrics::Metrics;

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

    #[test]
    fn test_generate_request_id() {
        let id1 = generate_request_id();
        let id2 = generate_request_id();
        assert_ne!(id1, id2);
        assert_eq!(id1.len(), 36);
    }

    #[test]
    fn test_metrics() {
        let metrics = Metrics::new();

        metrics.inc_http_request("GET", 200);
        metrics.inc_http_request("GET", 200);
        metrics.inc_http_request("POST", 201);
        metrics.inc_http_request("POST", 400);

        metrics.inc_auth_login();
        metrics.inc_auth_token_refresh();
        metrics.inc_auth_failure();

        metrics.inc_bookings_created();
        metrics.inc_payments_created();

        let json = metrics.to_json();
        assert!(json.contains("\"total\": 4"));
        assert!(json.contains("\"GET\": 2"));
        assert!(json.contains("\"POST\": 2"));
        assert!(json.contains("\"200\": 2"));
        assert!(json.contains("\"logins\": 1"));
        assert!(json.contains("\"bookings_created\": 1"));
    }

    #[tokio::test]
    async fn test_audit_logger() {
        let logger = AuditLogger::new();

        let event: AuditEvent = create_audit_event(
            "user_login",
            Some("user123"),
            Some("client456"),
            Some("192.168.1.1"),
            Some("Mozilla/5.0"),
            true,
            Some("Successful login"),
        );

        logger.log(event).await;

        let recent: Vec<AuditEvent> = logger.get_recent(10).await;
        assert_eq!(recent.len(), 1);
        assert_eq!(recent[0].event_type, "user_login");

        let by_user: Vec<AuditEvent> = logger.get_by_user("user123", 10).await;
        assert_eq!(by_user.len(), 1);
    }
}

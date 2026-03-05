use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Default)]
pub struct FcmConfig {
    pub server_key: String,
}

#[derive(Debug, thiserror::Error)]
pub enum FcmError {
    #[error("FCM not configured: {0}")]
    NotConfigured(String),
    #[error("Failed to send FCM message: {0}")]
    SendError(String),
}

#[derive(Clone)]
pub struct FcmService {
    server_key: String,
}

impl FcmService {
    pub fn new(config: FcmConfig) -> Result<Self, FcmError> {
        if config.server_key.is_empty() {
            return Err(FcmError::NotConfigured(
                "Server key is required".to_string(),
            ));
        }

        Ok(Self {
            server_key: config.server_key,
        })
    }

    pub async fn send_notification(
        &self,
        _token: &str,
        title: &str,
        body: &str,
        _data: Option<HashMap<String, String>>,
    ) -> Result<String, FcmError> {
        log::info!(
            "[FCM] Would send notification to token: title='{}', body='{}'",
            title,
            body
        );
        Ok("mock_message_id".to_string())
    }

    pub async fn send_to_topic(
        &self,
        topic: &str,
        title: &str,
        body: &str,
        _data: Option<HashMap<String, String>>,
    ) -> Result<String, FcmError> {
        log::info!(
            "[FCM] Would send to topic '{}': title='{}', body='{}'",
            topic,
            title,
            body
        );
        Ok("mock_message_id".to_string())
    }
}

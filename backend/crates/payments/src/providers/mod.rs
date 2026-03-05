use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PaymentProviderType {
    Stripe,
    MercadoPago,
    PagSeguro,
}

impl std::fmt::Display for PaymentProviderType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PaymentProviderType::Stripe => write!(f, "stripe"),
            PaymentProviderType::MercadoPago => write!(f, "mercadopago"),
            PaymentProviderType::PagSeguro => write!(f, "pagseguro"),
        }
    }
}

impl std::str::FromStr for PaymentProviderType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "stripe" => Ok(PaymentProviderType::Stripe),
            "mercadopago" => Ok(PaymentProviderType::MercadoPago),
            "pagseguro" => Ok(PaymentProviderType::PagSeguro),
            _ => Err(format!("Unknown payment provider: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentIntentResult {
    pub provider_payment_id: String,
    pub client_secret: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefundResult {
    pub provider_refund_id: String,
    pub status: String,
    pub refunded_amount: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookEvent {
    pub event_type: String,
    pub provider_payment_id: Option<String>,
    pub status: Option<String>,
    pub amount: Option<i64>,
    pub refunded_amount: Option<i64>,
    pub raw_payload: serde_json::Value,
}

#[derive(Debug, thiserror::Error)]
pub enum ProviderError {
    #[error("Provider not configured: {0}")]
    NotConfigured(String),

    #[error("API error: {0}")]
    ApiError(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Webhook verification failed")]
    WebhookVerificationFailed,

    #[error("Payment not found: {0}")]
    NotFound(String),

    #[error("Provider error: {0}")]
    ProviderSpecific(String),
}

#[async_trait]
pub trait PaymentProvider: Send + Sync {
    fn provider_type(&self) -> PaymentProviderType;

    async fn create_payment_intent(
        &self,
        amount_cents: i64,
        currency: &str,
        metadata: std::collections::HashMap<String, String>,
    ) -> Result<PaymentIntentResult, ProviderError>;

    async fn refund(
        &self,
        provider_payment_id: &str,
        amount_cents: Option<i64>,
    ) -> Result<RefundResult, ProviderError>;

    fn verify_webhook_signature(
        &self,
        payload: &[u8],
        signature: &str,
    ) -> Result<(), ProviderError>;

    fn parse_webhook_event(&self, payload: &[u8]) -> Result<WebhookEvent, ProviderError>;
}

pub mod stripe {
    use super::*;
    use std::sync::Arc;

    pub struct StripeProvider {
        api_key: String,
    }

    impl StripeProvider {
        pub fn new(api_key: String) -> Result<Self, ProviderError> {
            if api_key.is_empty() || api_key == "sk_test_placeholder" {
                return Err(ProviderError::NotConfigured(
                    "Stripe API key not configured".to_string(),
                ));
            }
            Ok(Self { api_key })
        }
    }

    #[async_trait]
    impl PaymentProvider for StripeProvider {
        fn provider_type(&self) -> PaymentProviderType {
            PaymentProviderType::Stripe
        }

        async fn create_payment_intent(
            &self,
            amount_cents: i64,
            currency: &str,
            metadata: std::collections::HashMap<String, String>,
        ) -> Result<PaymentIntentResult, ProviderError> {
            let payment_id = format!("pi_{}", ulid::Ulid::new());
            let client_secret = format!("{}_secret_{}", payment_id, ulid::Ulid::new());

            log::info!(
                "Creating Stripe payment intent: amount={} currency={} metadata={:?}",
                amount_cents,
                currency,
                metadata
            );

            Ok(PaymentIntentResult {
                provider_payment_id: payment_id,
                client_secret,
                status: "requires_payment_method".to_string(),
            })
        }

        async fn refund(
            &self,
            provider_payment_id: &str,
            amount_cents: Option<i64>,
        ) -> Result<RefundResult, ProviderError> {
            let refund_id = format!("re_{}", ulid::Ulid::new());
            let amount = amount_cents.unwrap_or(0);

            log::info!(
                "Processing Stripe refund: payment_id={} amount={}",
                provider_payment_id,
                amount
            );

            Ok(RefundResult {
                provider_refund_id: refund_id,
                status: "succeeded".to_string(),
                refunded_amount: amount,
            })
        }

        fn verify_webhook_signature(
            &self,
            _payload: &[u8],
            _signature: &str,
        ) -> Result<(), ProviderError> {
            Ok(())
        }

        fn parse_webhook_event(&self, payload: &[u8]) -> Result<WebhookEvent, ProviderError> {
            let value: serde_json::Value = serde_json::from_slice(payload)
                .map_err(|e| ProviderError::ApiError(e.to_string()))?;

            let event_type = value
                .get("type")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let data = value.get("data").and_then(|d| d.get("object"));
            let provider_payment_id = data
                .and_then(|d| d.get("id"))
                .and_then(|id| id.as_str())
                .map(|s| s.to_string());

            let status = data
                .and_then(|d| d.get("status"))
                .and_then(|s| s.as_str())
                .map(|s| s.to_string());

            let amount = data.and_then(|d| d.get("amount")).and_then(|a| a.as_i64());

            let refunded_amount = data
                .and_then(|d| d.get("amount_refunded"))
                .and_then(|a| a.as_i64());

            Ok(WebhookEvent {
                event_type,
                provider_payment_id,
                status,
                amount,
                refunded_amount,
                raw_payload: value,
            })
        }
    }
}

pub mod mock {
    use super::*;

    pub struct MockPaymentProvider {
        provider_type_enum: PaymentProviderType,
    }

    impl MockPaymentProvider {
        pub fn new(provider_type: PaymentProviderType) -> Self {
            Self {
                provider_type_enum: provider_type,
            }
        }
    }

    #[async_trait]
    impl PaymentProvider for MockPaymentProvider {
        fn provider_type(&self) -> PaymentProviderType {
            self.provider_type_enum
        }

        async fn create_payment_intent(
            &self,
            amount_cents: i64,
            currency: &str,
            metadata: std::collections::HashMap<String, String>,
        ) -> Result<PaymentIntentResult, ProviderError> {
            let payment_id = format!("mock_{}_{}", self.provider_type_enum, ulid::Ulid::new());
            let client_secret = format!("{}_secret_{}", payment_id, ulid::Ulid::new());

            log::info!(
                "Mock payment intent: provider={} amount={} currency={} metadata={:?}",
                self.provider_type_enum,
                amount_cents,
                currency,
                metadata
            );

            Ok(PaymentIntentResult {
                provider_payment_id: payment_id,
                client_secret,
                status: "requires_payment_method".to_string(),
            })
        }

        async fn refund(
            &self,
            provider_payment_id: &str,
            amount_cents: Option<i64>,
        ) -> Result<RefundResult, ProviderError> {
            let refund_id = format!("mock_refund_{}", ulid::Ulid::new());
            let amount = amount_cents.unwrap_or(0);

            log::info!(
                "Mock refund: provider_payment_id={} amount={}",
                provider_payment_id,
                amount
            );

            Ok(RefundResult {
                provider_refund_id: refund_id,
                status: "succeeded".to_string(),
                refunded_amount: amount,
            })
        }

        fn verify_webhook_signature(
            &self,
            _payload: &[u8],
            _signature: &str,
        ) -> Result<(), ProviderError> {
            Ok(())
        }

        fn parse_webhook_event(&self, payload: &[u8]) -> Result<WebhookEvent, ProviderError> {
            let value: serde_json::Value = serde_json::from_slice(payload)
                .map_err(|e| ProviderError::ApiError(e.to_string()))?;

            let event_type = value
                .get("type")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            Ok(WebhookEvent {
                event_type,
                provider_payment_id: None,
                status: None,
                amount: None,
                refunded_amount: None,
                raw_payload: value,
            })
        }
    }
}

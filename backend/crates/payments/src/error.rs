use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum PaymentError {
    #[error("Payment not found: {0}")]
    NotFound(String),

    #[error("Booking not found: {0}")]
    BookingNotFound(String),

    #[error("Invalid payment amount")]
    InvalidAmount,

    #[error("Payment already exists for this booking")]
    PaymentAlreadyExists,

    #[error("Stripe error: {0}")]
    StripeError(String),

    #[error("Stripe API error: {0}")]
    StripeApiError(String),

    #[error("Webhook verification failed")]
    WebhookVerificationFailed,

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),
}

impl IntoResponse for PaymentError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            PaymentError::NotFound(id) => (StatusCode::NOT_FOUND, id),
            PaymentError::BookingNotFound(id) => (StatusCode::NOT_FOUND, id),
            PaymentError::InvalidAmount => (
                StatusCode::BAD_REQUEST,
                "Invalid payment amount".to_string(),
            ),
            PaymentError::PaymentAlreadyExists => (
                StatusCode::CONFLICT,
                "Payment already exists for this booking".to_string(),
            ),
            PaymentError::StripeError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            PaymentError::StripeApiError(msg) => (StatusCode::BAD_GATEWAY, msg),
            PaymentError::WebhookVerificationFailed => (
                StatusCode::UNAUTHORIZED,
                "Webhook verification failed".to_string(),
            ),
            PaymentError::DatabaseError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            PaymentError::ConfigError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        let body = Json(json!({
            "error": error_message,
        }));

        (status, body).into_response()
    }
}

impl From<diesel::result::Error> for PaymentError {
    fn from(err: diesel::result::Error) -> Self {
        PaymentError::DatabaseError(err.to_string())
    }
}

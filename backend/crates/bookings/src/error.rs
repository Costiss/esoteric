use thiserror::Error;

#[derive(Debug, Error)]
pub enum BookingError {
    #[error("Database error: {0}")]
    Database(#[from] diesel::result::Error),

    #[error("Not found")]
    NotFound,

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Booking in invalid state for this operation")]
    InvalidState,
}

impl serde::Serialize for BookingError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl axum::response::IntoResponse for BookingError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match &self {
            BookingError::NotFound => (axum::http::StatusCode::NOT_FOUND, "Booking not found"),
            BookingError::InvalidRequest(e) => (axum::http::StatusCode::BAD_REQUEST, e.as_str()),
            BookingError::Conflict(e) => (axum::http::StatusCode::CONFLICT, e.as_str()),
            BookingError::Unauthorized => (axum::http::StatusCode::UNAUTHORIZED, "Unauthorized"),
            BookingError::InvalidState => (
                axum::http::StatusCode::BAD_REQUEST,
                "Booking in invalid state for this operation",
            ),
            BookingError::Database(_) => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Database error",
            ),
        };

        let _ = status;
        axum::Json(serde_json::json!({
            "error": message
        }))
        .into_response()
    }
}

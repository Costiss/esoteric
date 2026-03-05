use thiserror::Error;

#[derive(Debug, Error)]
pub enum ServiceError {
    #[error("Service not found")]
    NotFound,

    #[error("Service is not published")]
    NotPublished,

    #[error("Provider not found")]
    ProviderNotFound,

    #[error("Service already exists for this provider")]
    AlreadyExists,

    #[error("Database error: {0}")]
    Database(#[from] diesel::result::Error),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Unauthorized")]
    Unauthorized,
}

impl axum::response::IntoResponse for ServiceError {
    fn into_response(self) -> axum::response::Response {
        let (_status, message) = match &self {
            ServiceError::NotFound => (axum::http::StatusCode::NOT_FOUND, "Service not found"),
            ServiceError::NotPublished => (
                axum::http::StatusCode::FORBIDDEN,
                "Service is not published",
            ),
            ServiceError::ProviderNotFound => {
                (axum::http::StatusCode::NOT_FOUND, "Provider not found")
            }
            ServiceError::AlreadyExists => (
                axum::http::StatusCode::CONFLICT,
                "Service already exists for this provider",
            ),
            ServiceError::Database(_) => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Database error",
            ),
            ServiceError::InvalidRequest(e) => (axum::http::StatusCode::BAD_REQUEST, e.as_str()),
            ServiceError::Unauthorized => (axum::http::StatusCode::UNAUTHORIZED, "Unauthorized"),
        };

        axum::Json(serde_json::json!({
            "error": message
        }))
        .into_response()
    }
}

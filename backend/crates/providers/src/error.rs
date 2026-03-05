use thiserror::Error;

#[derive(Debug, Error)]
pub enum ProviderError {
    #[error("Provider not found")]
    NotFound,

    #[error("User is not a provider")]
    NotProvider,

    #[error("User already has a provider profile")]
    AlreadyProvider,

    #[error("Provider profile already exists")]
    ProfileExists,

    #[error("Database error: {0}")]
    Database(#[from] diesel::result::Error),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Unauthorized")]
    Unauthorized,
}

impl axum::response::IntoResponse for ProviderError {
    fn into_response(self) -> axum::response::Response {
        let (_status, message) = match &self {
            ProviderError::NotFound => (axum::http::StatusCode::NOT_FOUND, "Provider not found"),
            ProviderError::NotProvider => {
                (axum::http::StatusCode::FORBIDDEN, "User is not a provider")
            }
            ProviderError::AlreadyProvider => (
                axum::http::StatusCode::CONFLICT,
                "User already has a provider profile",
            ),
            ProviderError::ProfileExists => (
                axum::http::StatusCode::CONFLICT,
                "Provider profile already exists",
            ),
            ProviderError::Database(_) => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Database error",
            ),
            ProviderError::InvalidRequest(e) => (axum::http::StatusCode::BAD_REQUEST, e.as_str()),
            ProviderError::Unauthorized => (axum::http::StatusCode::UNAUTHORIZED, "Unauthorized"),
        };

        axum::Json(serde_json::json!({
            "error": message
        }))
        .into_response()
    }
}

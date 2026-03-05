use thiserror::Error;

#[derive(Debug, Error)]
pub enum UserError {
    #[error("User not found")]
    NotFound,

    #[error("Email already exists")]
    EmailExists,

    #[error("Invalid credentials")]
    InvalidCredentials,

    #[error("Database error: {0}")]
    Database(#[from] diesel::result::Error),

    #[error("Password hashing error: {0}")]
    Hashing(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),
}

impl axum::response::IntoResponse for UserError {
    fn into_response(self) -> axum::response::Response {
        let (_status, message) = match &self {
            UserError::NotFound => (axum::http::StatusCode::NOT_FOUND, "User not found"),
            UserError::EmailExists => (axum::http::StatusCode::CONFLICT, "Email already exists"),
            UserError::InvalidCredentials => {
                (axum::http::StatusCode::UNAUTHORIZED, "Invalid credentials")
            }
            UserError::Database(_) => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Database error",
            ),
            UserError::Hashing(_) => (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Password hashing error",
            ),
            UserError::InvalidRequest(e) => (axum::http::StatusCode::BAD_REQUEST, e.as_str()),
        };

        axum::Json(serde_json::json!({
            "error": message
        }))
        .into_response()
    }
}

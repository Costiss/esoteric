use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use std::sync::Arc;

use crate::models::{RevokeRequest, ErrorResponse};
use crate::AuthState;

pub async fn revoke(
    State(_auth_state): State<Arc<AuthState>>,
    Json(_request): Json<RevokeRequest>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    Ok(StatusCode::OK)
}

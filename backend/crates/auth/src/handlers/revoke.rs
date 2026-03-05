use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use std::sync::Arc;

use crate::models::{RevokeRequest, ErrorResponse};
use crate::db_models::revoke_refresh_token;
use crate::AuthState;

pub async fn revoke(
    State(auth_state): State<Arc<AuthState>>,
    Json(request): Json<RevokeRequest>,
) -> Result<StatusCode, (StatusCode, Json<ErrorResponse>)> {
    // If no database pool is available, return success (as per OAuth2 spec, 
    // revocation is best-effort and shouldn't fail)
    let pool = match &auth_state.db_pool {
        Some(pool) => pool,
        None => return Ok(StatusCode::OK),
    };

    let mut conn = match pool.get() {
        Ok(conn) => conn,
        Err(_) => return Ok(StatusCode::OK), // Best-effort: don't fail on DB errors
    };

    // Try to revoke the token
    // We don't reveal whether the token was found or not (security)
    let _ = revoke_refresh_token(&mut conn, &request.token);

    // Return 200 OK regardless of whether the token existed
    // This prevents token enumeration attacks
    Ok(StatusCode::OK)
}
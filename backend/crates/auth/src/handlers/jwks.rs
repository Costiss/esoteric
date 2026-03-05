use axum::{
    extract::State,
    Json,
};
use std::sync::Arc;

use crate::AuthState;

pub async fn jwks(State(auth_state): State<Arc<AuthState>>) -> Json<serde_json::Value> {
    Json(auth_state.jwt_service.get_jwks())
}

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Redirect},
    Json,
};
use serde::Deserialize;
use std::sync::Arc;
use std::time::Duration;

use crate::models::ErrorResponse;
use crate::AuthState;

#[derive(Debug, Deserialize)]
pub struct AuthorizeParams {
    pub response_type: String,
    pub client_id: String,
    pub redirect_uri: String,
    pub scope: Option<String>,
    pub state: Option<String>,
    pub code_challenge: Option<String>,
    pub code_challenge_method: Option<String>,
}

pub async fn authorize(
    Query(params): Query<AuthorizeParams>,
    State(auth_state): State<Arc<AuthState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    if params.response_type != "code" {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "unsupported_response_type".to_string(),
                error_description: Some("Only 'code' response type is supported".to_string()),
            }),
        ));
    }

    let scopes = params
        .scope
        .as_ref()
        .map(|s| s.split_whitespace().map(|s| s.to_string()).collect())
        .unwrap_or_default();

    let code = common::ulid_new();

    let auth_code_data = crate::models::AuthorizationCodeData {
        user_id: "temp_user_id".to_string(),
        client_id: params.client_id.clone(),
        redirect_uri: params.redirect_uri.clone(),
        scopes,
        code_challenge: params.code_challenge.clone(),
        code_challenge_method: params.code_challenge_method.clone(),
        created_at: chrono::Utc::now().timestamp(),
    };

    let cache_key = format!("code:{}", code);
    let ttl = Duration::from_secs(600);

    if let Err(e) = auth_state
        .cache
        .set(&cache_key, &auth_code_data.to_json().unwrap(), ttl)
        .await
    {
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "server_error".to_string(),
                error_description: Some(format!("Failed to store authorization code: {}", e)),
            }),
        ));
    }

    let mut redirect_url = format!("{}?code={}", params.redirect_uri, code);
    if let Some(state) = params.state {
        redirect_url.push_str(&format!("&state={}", urlencoding::encode(&state)));
    }

    Ok(Redirect::temporary(&redirect_url))
}

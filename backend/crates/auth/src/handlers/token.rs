use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use std::sync::Arc;

use crate::models::{TokenRequest, TokenResponse, ErrorResponse};
use crate::pkce::{verify_pkce_challenge, PkceChallengeMethod};
use crate::AuthState;

pub async fn token(
    State(auth_state): State<Arc<AuthState>>,
    Json(request): Json<TokenRequest>,
) -> Result<Json<TokenResponse>, (StatusCode, Json<ErrorResponse>)> {
    match request.grant_type.as_str() {
        "authorization_code" => handle_authorization_code(&auth_state, request).await,
        "refresh_token" => handle_refresh_token(&auth_state, request).await,
        _ => Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "unsupported_grant_type".to_string(),
                error_description: Some("Only 'authorization_code' and 'refresh_token' grant types are supported".to_string()),
            }),
        )),
    }
}

async fn handle_authorization_code(
    auth_state: &AuthState,
    request: TokenRequest,
) -> Result<Json<TokenResponse>, (StatusCode, Json<ErrorResponse>)> {
    let code = request.code.ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_request".to_string(),
                error_description: Some("Missing 'code' parameter".to_string()),
            }),
        )
    })?;

    let cache_key = format!("code:{}", code);
    
    let auth_code_json = auth_state
        .cache
        .get_and_delete(&cache_key)
        .await
        .map_err(|_| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid_grant".to_string(),
                    error_description: Some("Invalid or expired authorization code".to_string()),
                }),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid_grant".to_string(),
                    error_description: Some("Invalid or expired authorization code".to_string()),
                }),
            )
        })?;

    let auth_code_data = crate::models::AuthorizationCodeData::from_json(&auth_code_json)
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "server_error".to_string(),
                    error_description: Some("Failed to parse authorization code data".to_string()),
                }),
            )
        })?;

    if auth_code_data.client_id != request.client_id {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_grant".to_string(),
                error_description: Some("Client ID mismatch".to_string()),
            }),
        ));
    }

    if let (Some(code_challenge), Some(code_verifier)) = 
        (auth_code_data.code_challenge, request.code_verifier) {
        let method = auth_code_data
            .code_challenge_method
            .as_ref()
            .and_then(|m| PkceChallengeMethod::from_str(m))
            .unwrap_or(PkceChallengeMethod::S256);

        if !verify_pkce_challenge(&code_verifier, &code_challenge, &method) {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(ErrorResponse {
                    error: "invalid_grant".to_string(),
                    error_description: Some("PKCE verification failed".to_string()),
                }),
            ));
        }
    }

    let access_token = auth_state
        .jwt_service
        .generate_access_token(
            &auth_code_data.user_id,
            &auth_code_data.client_id,
            &auth_code_data.scopes,
            3600,
        )
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "server_error".to_string(),
                    error_description: Some(format!("Failed to generate access token: {}", e)),
                }),
            )
        })?;

    Ok(Json(TokenResponse {
        access_token,
        token_type: "Bearer".to_string(),
        expires_in: 3600,
        refresh_token: None,
        scope: Some(auth_code_data.scopes.join(" ")),
    }))
}

async fn handle_refresh_token(
    _auth_state: &AuthState,
    _request: TokenRequest,
) -> Result<Json<TokenResponse>, (StatusCode, Json<ErrorResponse>)> {
    Err((
        StatusCode::NOT_IMPLEMENTED,
        Json(ErrorResponse {
            error: "server_error".to_string(),
            error_description: Some("Refresh token flow not yet implemented".to_string()),
        }),
    ))
}

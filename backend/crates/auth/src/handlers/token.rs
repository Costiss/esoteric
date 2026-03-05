use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use std::sync::Arc;

use crate::models::{TokenRequest, TokenResponse, ErrorResponse};
use crate::pkce::{verify_pkce_challenge, PkceChallengeMethod};
use crate::db_models::{create_refresh_token, validate_refresh_token, get_token_scopes};
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

    // Generate and store refresh token
    let refresh_token = if let Some(ref pool) = auth_state.db_pool {
        let mut conn = pool.get().map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorResponse {
                    error: "server_error".to_string(),
                    error_description: Some(format!("Database connection error: {}", e)),
                }),
            )
        })?;

        match create_refresh_token(
            &mut conn,
            &auth_code_data.user_id,
            &auth_code_data.client_id,
            &auth_code_data.scopes,
            30, // 30 days expiration
        ) {
            Ok((_, raw_token)) => Some(raw_token),
            Err(e) => {
                eprintln!("Failed to create refresh token: {}", e);
                None
            }
        }
    } else {
        None
    };

    Ok(Json(TokenResponse {
        access_token,
        token_type: "Bearer".to_string(),
        expires_in: 3600,
        refresh_token,
        scope: Some(auth_code_data.scopes.join(" ")),
    }))
}

async fn handle_refresh_token(
    auth_state: &AuthState,
    request: TokenRequest,
) -> Result<Json<TokenResponse>, (StatusCode, Json<ErrorResponse>)> {
    let raw_refresh_token = request.refresh_token.ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_request".to_string(),
                error_description: Some("Missing 'refresh_token' parameter".to_string()),
            }),
        )
    })?;

    let pool = auth_state.db_pool.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ErrorResponse {
                error: "server_error".to_string(),
                error_description: Some("Database not available".to_string()),
            }),
        )
    })?;

    let mut conn = pool.get().map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "server_error".to_string(),
                error_description: Some(format!("Database connection error: {}", e)),
            }),
        )
    })?;

    let stored_token = validate_refresh_token(
        &mut conn,
        &raw_refresh_token,
        &request.client_id,
    ).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: "server_error".to_string(),
                error_description: Some(format!("Database error: {}", e)),
            }),
        )
    })?;

    let stored_token = stored_token.ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "invalid_grant".to_string(),
                error_description: Some("Invalid or expired refresh token".to_string()),
            }),
        )
    })?;

    let scopes = get_token_scopes(&stored_token);

    let access_token = auth_state
        .jwt_service
        .generate_access_token(
            &stored_token.user_id,
            &stored_token.client_id,
            &scopes,
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
        refresh_token: None, // Could implement refresh token rotation here
        scope: Some(scopes.join(" ")),
    }))
}
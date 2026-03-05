use axum::{
    extract::{Json, Path, State},
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::db::{self, DbPool};
use crate::error::UserError;
use crate::models::*;

pub type AppState = Arc<DbPool>;

#[derive(Clone)]
pub struct UserState {
    pub db_pool: DbPool,
    pub jwt_secret: String,
    pub jwt_issuer: String,
}

impl UserState {
    pub fn new(db_pool: DbPool) -> Self {
        Self {
            db_pool,
            jwt_secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "default-secret".to_string()),
            jwt_issuer: std::env::var("JWT_ISSUER").unwrap_or_else(|_| "esotheric".to_string()),
        }
    }

    pub fn with_jwt(db_pool: DbPool, jwt_secret: String, jwt_issuer: String) -> Self {
        Self {
            db_pool,
            jwt_secret,
            jwt_issuer,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct TokenClaims {
    sub: String,
    iss: String,
    exp: usize,
    iat: usize,
}

fn generate_tokens(user: &User, state: &UserState) -> Result<(String, String), UserError> {
    use chrono::{Duration, Utc};
    use jsonwebtoken::{encode, EncodingKey, Header};

    let now = Utc::now();

    let access_claims = TokenClaims {
        sub: user.id.clone(),
        iss: state.jwt_issuer.clone(),
        exp: (now + Duration::hours(1)).timestamp() as usize,
        iat: now.timestamp() as usize,
    };

    let access_token = encode(
        &Header::new(jsonwebtoken::Algorithm::HS256),
        &access_claims,
        &EncodingKey::from_secret(state.jwt_secret.as_bytes()),
    )
    .map_err(|e| UserError::InvalidRequest(e.to_string()))?;

    let refresh_claims = TokenClaims {
        sub: user.id.clone(),
        iss: state.jwt_issuer.clone(),
        exp: (now + Duration::days(30)).timestamp() as usize,
        iat: now.timestamp() as usize,
    };

    let refresh_token = encode(
        &Header::new(jsonwebtoken::Algorithm::HS256),
        &refresh_claims,
        &EncodingKey::from_secret(state.jwt_secret.as_bytes()),
    )
    .map_err(|e| UserError::InvalidRequest(e.to_string()))?;

    Ok((access_token, refresh_token))
}

pub async fn register(
    State(state): State<UserState>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<impl IntoResponse, UserError> {
    if payload.email.is_empty() || payload.password.is_empty() {
        return Err(UserError::InvalidRequest(
            "Email and password are required".to_string(),
        ));
    }

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| UserError::InvalidRequest(e.to_string()))?;

    let user = db::create_user(&mut conn, payload)?;
    let (access_token, refresh_token) = generate_tokens(&user, &state)?;

    Ok(axum::Json(LoginResponse {
        user: user.into(),
        access_token,
        refresh_token,
    }))
}

pub async fn login(
    State(state): State<UserState>,
    Json(payload): Json<LoginRequest>,
) -> Result<impl IntoResponse, UserError> {
    if payload.email.is_empty() || payload.password.is_empty() {
        return Err(UserError::InvalidRequest(
            "Email and password are required".to_string(),
        ));
    }

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| UserError::InvalidRequest(e.to_string()))?;

    let user = db::get_user_by_email(&mut conn, &payload.email)?;

    if !user.is_active {
        return Err(UserError::InvalidCredentials);
    }

    let password_hash = user
        .password_hash
        .as_ref()
        .ok_or(UserError::InvalidCredentials)?;

    let valid = db::verify_password(&payload.password, password_hash)?;
    if !valid {
        return Err(UserError::InvalidCredentials);
    }

    let (access_token, refresh_token) = generate_tokens(&user, &state)?;

    Ok(axum::Json(LoginResponse {
        user: user.into(),
        access_token,
        refresh_token,
    }))
}

pub async fn get_profile(
    State(state): State<UserState>,
    Path(user_id): Path<String>,
) -> Result<impl IntoResponse, UserError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| UserError::InvalidRequest(e.to_string()))?;

    let user = db::get_user_by_id(&mut conn, &user_id)?;

    Ok(axum::Json(UserResponse::from(user)))
}

pub async fn update_profile(
    State(state): State<UserState>,
    Path(user_id): Path<String>,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<impl IntoResponse, UserError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| UserError::InvalidRequest(e.to_string()))?;

    let user = db::update_user(&mut conn, &user_id, payload)?;

    Ok(axum::Json(UserResponse::from(user)))
}

pub async fn change_password(
    State(state): State<UserState>,
    Path(user_id): Path<String>,
    Json(payload): Json<ChangePasswordRequest>,
) -> Result<impl IntoResponse, UserError> {
    if payload.new_password.is_empty() {
        return Err(UserError::InvalidRequest(
            "New password is required".to_string(),
        ));
    }

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| UserError::InvalidRequest(e.to_string()))?;

    let user = db::get_user_by_id(&mut conn, &user_id)?;

    if let Some(ref hash) = user.password_hash {
        let valid = db::verify_password(&payload.current_password, hash)?;
        if !valid {
            return Err(UserError::InvalidCredentials);
        }
    }

    let user = db::update_password(&mut conn, &user_id, &payload.new_password)?;

    Ok(axum::Json(UserResponse::from(user)))
}

#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

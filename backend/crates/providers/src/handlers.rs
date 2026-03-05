use axum::{
    extract::{Query, State},
    response::IntoResponse,
    Json,
};
use serde::Deserialize;

use crate::db::{self, DbPool};
use crate::error::ProviderError;
use crate::models::{CreateProviderRequest, ProviderResponse, UpdateProviderRequest};

#[derive(Clone)]
pub struct ProviderState {
    pub db_pool: DbPool,
}

impl ProviderState {
    pub fn new(db_pool: DbPool) -> Self {
        Self { db_pool }
    }
}

#[derive(Deserialize)]
pub struct ListProvidersQuery {
    limit: Option<i64>,
    offset: Option<i64>,
    verified_only: Option<bool>,
}

pub async fn create_provider(
    State(state): State<ProviderState>,
    axum::extract::Path(user_id): axum::extract::Path<String>,
    Json(payload): Json<CreateProviderRequest>,
) -> Result<impl IntoResponse, ProviderError> {
    if payload.display_name.is_empty() {
        return Err(ProviderError::InvalidRequest(
            "Display name is required".to_string(),
        ));
    }

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ProviderError::InvalidRequest(e.to_string()))?;

    let provider = db::create_provider(&mut conn, &user_id, payload)?;

    Ok(axum::Json(ProviderResponse::from(provider)))
}

pub async fn get_provider(
    State(state): State<ProviderState>,
    axum::extract::Path(provider_id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ProviderError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ProviderError::InvalidRequest(e.to_string()))?;

    let provider = db::get_provider_by_id(&mut conn, &provider_id)?;

    Ok(axum::Json(ProviderResponse::from(provider)))
}

pub async fn get_provider_by_user(
    State(state): State<ProviderState>,
    axum::extract::Path(user_id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ProviderError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ProviderError::InvalidRequest(e.to_string()))?;

    let provider = db::get_provider_by_user_id(&mut conn, &user_id)?;

    Ok(axum::Json(ProviderResponse::from(provider)))
}

pub async fn update_provider(
    State(state): State<ProviderState>,
    axum::extract::Path(provider_id): axum::extract::Path<String>,
    Json(payload): Json<UpdateProviderRequest>,
) -> Result<impl IntoResponse, ProviderError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ProviderError::InvalidRequest(e.to_string()))?;

    let provider = db::update_provider(&mut conn, &provider_id, payload)?;

    Ok(axum::Json(ProviderResponse::from(provider)))
}

pub async fn list_providers(
    State(state): State<ProviderState>,
    Query(query): Query<ListProvidersQuery>,
) -> Result<impl IntoResponse, ProviderError> {
    let limit = query.limit.unwrap_or(20);
    let offset = query.offset.unwrap_or(0);

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ProviderError::InvalidRequest(e.to_string()))?;

    let providers = if query.verified_only.unwrap_or(false) {
        db::list_verified_providers(&mut conn, limit, offset)?
    } else {
        db::list_providers(&mut conn, limit, offset)?
    };

    let responses: Vec<ProviderResponse> = providers.into_iter().map(|p| p.into()).collect();

    Ok(axum::Json(responses))
}

pub async fn verify_provider(
    State(state): State<ProviderState>,
    axum::extract::Path(provider_id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ProviderError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ProviderError::InvalidRequest(e.to_string()))?;

    let provider = db::verify_provider(&mut conn, &provider_id)?;

    Ok(axum::Json(ProviderResponse::from(provider)))
}

pub async fn deactivate_provider(
    State(state): State<ProviderState>,
    axum::extract::Path(provider_id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ProviderError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ProviderError::InvalidRequest(e.to_string()))?;

    let provider = db::deactivate_provider(&mut conn, &provider_id)?;

    Ok(axum::Json(ProviderResponse::from(provider)))
}

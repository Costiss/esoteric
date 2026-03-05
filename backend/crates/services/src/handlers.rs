use axum::{
    extract::{Query, State},
    response::IntoResponse,
    Json,
};
use serde::Deserialize;

use crate::db::{self, DbPool};
use crate::error::ServiceError;
use crate::models::{CreateServiceRequest, ServiceResponse, UpdateServiceRequest};

#[derive(Clone)]
pub struct ServiceState {
    pub db_pool: DbPool,
}

impl ServiceState {
    pub fn new(db_pool: DbPool) -> Self {
        Self { db_pool }
    }
}

#[derive(Deserialize)]
pub struct ListServicesQuery {
    limit: Option<i64>,
    offset: Option<i64>,
    published_only: Option<bool>,
}

#[derive(Deserialize)]
pub struct SearchServicesQuery {
    tag: Option<String>,
    min_price: Option<i32>,
    max_price: Option<i32>,
    provider_verified_only: Option<bool>,
    limit: Option<i64>,
    offset: Option<i64>,
}

pub async fn create_service(
    State(state): State<ServiceState>,
    axum::extract::Path(provider_id): axum::extract::Path<String>,
    Json(payload): Json<CreateServiceRequest>,
) -> Result<impl IntoResponse, ServiceError> {
    if payload.title.is_empty() {
        return Err(ServiceError::InvalidRequest(
            "Title is required".to_string(),
        ));
    }

    if payload.duration_minutes <= 0 {
        return Err(ServiceError::InvalidRequest(
            "Duration must be positive".to_string(),
        ));
    }

    if payload.price_cents <= 0 {
        return Err(ServiceError::InvalidRequest(
            "Price must be positive".to_string(),
        ));
    }

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ServiceError::InvalidRequest(e.to_string()))?;

    let service = db::create_service(&mut conn, &provider_id, payload)?;

    Ok(axum::Json(ServiceResponse::from(service)))
}

pub async fn get_service(
    State(state): State<ServiceState>,
    axum::extract::Path(service_id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ServiceError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ServiceError::InvalidRequest(e.to_string()))?;

    let service = db::get_service_by_id(&mut conn, &service_id)?;

    Ok(axum::Json(ServiceResponse::from(service)))
}

pub async fn get_published_service(
    State(state): State<ServiceState>,
    axum::extract::Path(service_id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ServiceError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ServiceError::InvalidRequest(e.to_string()))?;

    let service = db::get_published_service_by_id(&mut conn, &service_id)?;

    Ok(axum::Json(ServiceResponse::from(service)))
}

pub async fn get_provider_services(
    State(state): State<ServiceState>,
    axum::extract::Path(provider_id): axum::extract::Path<String>,
    Query(query): Query<ListServicesQuery>,
) -> Result<impl IntoResponse, ServiceError> {
    let limit = query.limit.unwrap_or(20);
    let offset = query.offset.unwrap_or(0);

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ServiceError::InvalidRequest(e.to_string()))?;

    let services = db::get_services_by_provider(&mut conn, &provider_id, limit, offset)?;

    let responses: Vec<ServiceResponse> = services.into_iter().map(|s| s.into()).collect();

    Ok(axum::Json(responses))
}

pub async fn update_service(
    State(state): State<ServiceState>,
    axum::extract::Path(service_id): axum::extract::Path<String>,
    Json(payload): Json<UpdateServiceRequest>,
) -> Result<impl IntoResponse, ServiceError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ServiceError::InvalidRequest(e.to_string()))?;

    let service = db::update_service(&mut conn, &service_id, payload)?;

    Ok(axum::Json(ServiceResponse::from(service)))
}

pub async fn publish_service(
    State(state): State<ServiceState>,
    axum::extract::Path(service_id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ServiceError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ServiceError::InvalidRequest(e.to_string()))?;

    let service = db::publish_service(&mut conn, &service_id)?;

    Ok(axum::Json(ServiceResponse::from(service)))
}

pub async fn unpublish_service(
    State(state): State<ServiceState>,
    axum::extract::Path(service_id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ServiceError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ServiceError::InvalidRequest(e.to_string()))?;

    let service = db::unpublish_service(&mut conn, &service_id)?;

    Ok(axum::Json(ServiceResponse::from(service)))
}

pub async fn delete_service(
    State(state): State<ServiceState>,
    axum::extract::Path(service_id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, ServiceError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ServiceError::InvalidRequest(e.to_string()))?;

    db::delete_service(&mut conn, &service_id)?;

    Ok(axum::http::StatusCode::NO_CONTENT)
}

pub async fn list_services(
    State(state): State<ServiceState>,
    Query(query): Query<ListServicesQuery>,
) -> Result<impl IntoResponse, ServiceError> {
    let limit = query.limit.unwrap_or(20);
    let offset = query.offset.unwrap_or(0);

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ServiceError::InvalidRequest(e.to_string()))?;

    let services = if query.published_only.unwrap_or(true) {
        db::list_published_services(&mut conn, limit, offset)?
    } else {
        db::get_services_by_provider(&mut conn, "", limit, offset)?
    };

    let responses: Vec<ServiceResponse> = services.into_iter().map(|s| s.into()).collect();

    Ok(axum::Json(responses))
}

pub async fn search_services(
    State(state): State<ServiceState>,
    Query(query): Query<SearchServicesQuery>,
) -> Result<impl IntoResponse, ServiceError> {
    let limit = query.limit.unwrap_or(20);
    let offset = query.offset.unwrap_or(0);

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| ServiceError::InvalidRequest(e.to_string()))?;

    let services = db::search_services(
        &mut conn,
        query.tag.as_deref(),
        query.min_price,
        query.max_price,
        query.provider_verified_only.unwrap_or(false),
        limit,
        offset,
    )?;

    let responses: Vec<ServiceResponse> = services.into_iter().map(|s| s.into()).collect();

    Ok(axum::Json(responses))
}

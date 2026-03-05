use axum::{
    extract::{Query, State},
    response::IntoResponse,
    Json,
};
use serde::Deserialize;

use crate::db::{self, DbPool};
use crate::error::BookingError;
use crate::models::{
    Booking, BookingResponse, CancelBookingRequest, CreateBookingRequest, UpdateBookingRequest,
};
use services::db as services_db;
use services::error::ServiceError;

#[derive(Clone)]
pub struct BookingState {
    pub db_pool: DbPool,
}

impl BookingState {
    pub fn new(db_pool: DbPool) -> Self {
        Self { db_pool }
    }
}

#[derive(Deserialize)]
pub struct ListBookingsQuery {
    status: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
}

#[derive(Deserialize)]
pub struct GetBookingsByDateQuery {
    provider_id: Option<String>,
    customer_id: Option<String>,
    service_id: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
    limit: Option<i64>,
    offset: Option<i64>,
}

pub async fn create_booking(
    State(state): State<BookingState>,
    Json(payload): Json<CreateBookingRequest>,
) -> Result<impl IntoResponse, BookingError> {
    if payload.service_id.is_empty() {
        return Err(BookingError::InvalidRequest(
            "Service ID is required".to_string(),
        ));
    }

    let start_ts = match chrono::DateTime::parse_from_rfc3339(&payload.start_ts) {
        Ok(dt) => dt.with_timezone(&chrono::Utc),
        Err(_) => {
            return Err(BookingError::InvalidRequest(
                "Invalid start_ts format. Use RFC3339".to_string(),
            ))
        }
    };

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| BookingError::InvalidRequest(e.to_string()))?;

    let service = services_db::get_published_service_by_id(&mut conn, &payload.service_id)
        .map_err(|e| match e {
            ServiceError::NotFound => BookingError::NotFound,
            _ => BookingError::Database(diesel::result::Error::QueryBuilderError(
                e.to_string().into(),
            )),
        })?;

    let end_ts = start_ts + chrono::Duration::minutes(service.duration_minutes as i64);

    let booking = db::create_booking(
        &mut conn,
        &payload.service_id,
        "customer_id_placeholder",
        &service.provider_id,
        start_ts,
        end_ts,
        service.price_cents,
        &service.currency,
        payload.client_notes,
    )?;

    Ok(axum::Json(BookingResponse::from(booking)))
}

pub async fn get_booking(
    State(state): State<BookingState>,
    axum::extract::Path(booking_id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, BookingError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| BookingError::InvalidRequest(e.to_string()))?;

    let booking = db::get_booking_by_id(&mut conn, &booking_id)?;

    Ok(axum::Json(BookingResponse::from(booking)))
}

pub async fn get_customer_bookings(
    State(state): State<BookingState>,
    axum::extract::Path(customer_id): axum::extract::Path<String>,
    Query(query): Query<ListBookingsQuery>,
) -> Result<impl IntoResponse, BookingError> {
    let limit = query.limit.unwrap_or(20);
    let offset = query.offset.unwrap_or(0);

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| BookingError::InvalidRequest(e.to_string()))?;

    let bookings = db::get_bookings_by_customer(&mut conn, &customer_id, limit, offset)?;

    let responses: Vec<BookingResponse> = bookings.into_iter().map(|b: Booking| b.into()).collect();

    Ok(axum::Json(responses))
}

pub async fn get_provider_bookings(
    State(state): State<BookingState>,
    axum::extract::Path(provider_id): axum::extract::Path<String>,
    Query(query): Query<ListBookingsQuery>,
) -> Result<impl IntoResponse, BookingError> {
    let limit = query.limit.unwrap_or(20);
    let offset = query.offset.unwrap_or(0);

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| BookingError::InvalidRequest(e.to_string()))?;

    let bookings = db::get_bookings_by_provider(&mut conn, &provider_id, limit, offset)?;

    let responses: Vec<BookingResponse> = bookings.into_iter().map(|b: Booking| b.into()).collect();

    Ok(axum::Json(responses))
}

pub async fn get_service_bookings(
    State(state): State<BookingState>,
    axum::extract::Path(service_id): axum::extract::Path<String>,
    Query(query): Query<ListBookingsQuery>,
) -> Result<impl IntoResponse, BookingError> {
    let limit = query.limit.unwrap_or(20);
    let offset = query.offset.unwrap_or(0);

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| BookingError::InvalidRequest(e.to_string()))?;

    let bookings = db::get_bookings_by_service(&mut conn, &service_id, limit, offset)?;

    let responses: Vec<BookingResponse> = bookings.into_iter().map(|b: Booking| b.into()).collect();

    Ok(axum::Json(responses))
}

pub async fn confirm_booking(
    State(state): State<BookingState>,
    axum::extract::Path(booking_id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, BookingError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| BookingError::InvalidRequest(e.to_string()))?;

    let booking = db::confirm_booking(&mut conn, &booking_id)?;

    Ok(axum::Json(BookingResponse::from(booking)))
}

pub async fn start_booking(
    State(state): State<BookingState>,
    axum::extract::Path(booking_id): axum::extract::Path<String>,
) -> Result<impl IntoResponse, BookingError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| BookingError::InvalidRequest(e.to_string()))?;

    let booking = db::start_booking(&mut conn, &booking_id)?;

    Ok(axum::Json(BookingResponse::from(booking)))
}

pub async fn complete_booking(
    State(state): State<BookingState>,
    axum::extract::Path(booking_id): axum::extract::Path<String>,
    Json(payload): Json<UpdateBookingRequest>,
) -> Result<impl IntoResponse, BookingError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| BookingError::InvalidRequest(e.to_string()))?;

    let booking = db::complete_booking(&mut conn, &booking_id, payload.provider_notes)?;

    Ok(axum::Json(BookingResponse::from(booking)))
}

pub async fn cancel_booking(
    State(state): State<BookingState>,
    axum::extract::Path(booking_id): axum::extract::Path<String>,
    Json(payload): Json<CancelBookingRequest>,
) -> Result<impl IntoResponse, BookingError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| BookingError::InvalidRequest(e.to_string()))?;

    let booking = db::cancel_booking(
        &mut conn,
        &booking_id,
        "customer_id_placeholder",
        &payload.reason,
    )?;

    Ok(axum::Json(BookingResponse::from(booking)))
}

pub async fn list_bookings(
    State(state): State<BookingState>,
    Query(query): Query<ListBookingsQuery>,
) -> Result<impl IntoResponse, BookingError> {
    let limit = query.limit.unwrap_or(20);
    let offset = query.offset.unwrap_or(0);

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| BookingError::InvalidRequest(e.to_string()))?;

    let bookings = db::list_bookings(&mut conn, query.status.as_deref(), limit, offset)?;

    let responses: Vec<BookingResponse> = bookings.into_iter().map(|b: Booking| b.into()).collect();

    Ok(axum::Json(responses))
}

pub async fn check_availability(
    State(state): State<BookingState>,
    axum::extract::Path(provider_id): axum::extract::Path<String>,
    Query(query): Query<GetBookingsByDateQuery>,
) -> Result<impl IntoResponse, BookingError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| BookingError::InvalidRequest(e.to_string()))?;

    let bookings = db::get_bookings_by_provider(&mut conn, &provider_id, 100, 0)?;

    let responses: Vec<BookingResponse> = bookings.into_iter().map(|b: Booking| b.into()).collect();

    Ok(axum::Json(responses))
}

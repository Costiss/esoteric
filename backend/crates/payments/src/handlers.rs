use crate::db::{self, DbPool};
use crate::error::PaymentError;
use crate::models::{
    CreatePaymentIntentResponse, CreatePaymentRequest, NewPayment, PaymentResponse,
    PLATFORM_COMMISSION_PERCENT,
};
use crate::providers::{PaymentProvider, PaymentProviderType};
use axum::{
    extract::{Path, State},
    Json,
};
use common::ulid_new;
use diesel::r2d2::PooledConnection;
use std::collections::HashMap;
use std::sync::Arc;

pub struct PaymentState {
    pub db_pool: DbPool,
    pub provider: Arc<dyn PaymentProvider>,
}

impl PaymentState {
    pub fn new(db_pool: DbPool, provider: Arc<dyn PaymentProvider>) -> Self {
        Self { db_pool, provider }
    }
}

pub async fn create_payment_intent(
    State(state): State<Arc<PaymentState>>,
    Json(req): Json<CreatePaymentRequest>,
) -> Result<Json<CreatePaymentIntentResponse>, PaymentError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| PaymentError::DatabaseError(e.to_string()))?;

    let existing_payment = db::get_payment_by_booking_id(&mut conn, &req.booking_id);
    if existing_payment.is_ok() {
        return Err(PaymentError::PaymentAlreadyExists);
    }

    let payment_id = ulid_new();
    let amount_cents: i32 = req
        .metadata
        .as_ref()
        .and_then(|m| m.get("amount_cents"))
        .and_then(|v| v.as_i64())
        .unwrap_or(10000) as i32;

    let currency = req
        .metadata
        .as_ref()
        .and_then(|m| m.get("currency"))
        .and_then(|v| v.as_str())
        .unwrap_or("BRL");

    let customer_id = req
        .metadata
        .as_ref()
        .and_then(|m| m.get("customer_id"))
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let provider_id = req
        .metadata
        .as_ref()
        .and_then(|m| m.get("provider_id"))
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let commission = (amount_cents as f64 * PLATFORM_COMMISSION_PERCENT as f64 / 100.0) as i32;
    let provider_type_str = state.provider.provider_type().to_string();

    let new_payment = NewPayment {
        id: payment_id.clone(),
        booking_id: req.booking_id.clone(),
        customer_id: customer_id.to_string(),
        provider_id: provider_id.to_string(),
        provider_type: provider_type_str.clone(),
        provider_payment_id: None,
        amount_cents,
        currency: currency.to_string(),
        status: "pending".to_string(),
        customer_email: req.customer_email.clone(),
        metadata: req.metadata.clone(),
        commission_amount_cents: commission,
    };

    db::create_payment(&mut conn, &new_payment)
        .map_err(|e| PaymentError::DatabaseError(e.to_string()))?;

    let mut metadata = HashMap::new();
    metadata.insert("payment_id".to_string(), payment_id.clone());
    metadata.insert("booking_id".to_string(), req.booking_id.clone());
    metadata.insert("customer_id".to_string(), customer_id.to_string());

    let intent_result = state
        .provider
        .create_payment_intent(amount_cents as i64, currency, metadata)
        .await
        .map_err(|e| PaymentError::StripeApiError(e.to_string()))?;

    db::update_payment_with_provider_id(
        &mut conn,
        &payment_id,
        &intent_result.provider_payment_id,
        &intent_result.status,
    )
    .map_err(|e| PaymentError::DatabaseError(e.to_string()))?;

    Ok(Json(CreatePaymentIntentResponse {
        client_secret: intent_result.client_secret,
        payment_id,
        provider_type: provider_type_str,
    }))
}

pub async fn get_payment(
    State(state): State<Arc<PaymentState>>,
    Path(payment_id): Path<String>,
) -> Result<Json<PaymentResponse>, PaymentError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| PaymentError::DatabaseError(e.to_string()))?;

    let payment = db::get_payment_by_id(&mut conn, &payment_id)
        .map_err(|_| PaymentError::NotFound(payment_id))?;

    Ok(Json(payment.into()))
}

pub async fn get_payment_by_booking(
    State(state): State<Arc<PaymentState>>,
    Path(booking_id): Path<String>,
) -> Result<Json<PaymentResponse>, PaymentError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| PaymentError::DatabaseError(e.to_string()))?;

    let payment = db::get_payment_by_booking_id(&mut conn, &booking_id)
        .map_err(|_| PaymentError::NotFound(booking_id))?;

    Ok(Json(payment.into()))
}

pub async fn handle_webhook(
    State(state): State<Arc<PaymentState>>,
    payload: String,
) -> Result<Json<serde_json::Value>, PaymentError> {
    let payload_bytes = payload.as_bytes();

    let event = serde_json::from_slice::<serde_json::Value>(payload_bytes)
        .map_err(|e| PaymentError::StripeError(e.to_string()))?;

    let event_type = event.get("type").and_then(|v| v.as_str()).unwrap_or("");

    let data = event.get("data").and_then(|d| d.get("object"));
    let provider_payment_id = data.and_then(|d| d.get("id")).and_then(|id| id.as_str());

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| PaymentError::DatabaseError(e.to_string()))?;

    match event_type {
        "payment_intent.succeeded" | "payment_intent.payment_failed" | "charge.refunded" => {
            if let Some(pi_id) = provider_payment_id {
                let payment_result = db::get_payment_by_provider_payment_id(&mut conn, pi_id);

                match (event_type, payment_result) {
                    ("payment_intent.succeeded", Ok(payment)) => {
                        let charge_id = data
                            .and_then(|d| d.get("charges"))
                            .and_then(|c| c.get("data"))
                            .and_then(|arr| arr.as_array())
                            .and_then(|arr| arr.first())
                            .and_then(|c| c.get("id"))
                            .and_then(|id| id.as_str());

                        db::mark_payment_succeeded(&mut conn, &payment.id, charge_id).ok();
                    }
                    ("payment_intent.payment_failed", Ok(payment)) => {
                        db::update_payment_status(&mut conn, &payment.id, "canceled").ok();
                    }
                    ("charge.refunded", Ok(payment)) => {
                        let refunded_amount = data
                            .and_then(|d| d.get("amount_refunded"))
                            .and_then(|a| a.as_i64())
                            .unwrap_or(0) as i32;

                        if refunded_amount > 0 {
                            db::update_payment_refund(&mut conn, &payment.id, refunded_amount).ok();
                        }
                    }
                    _ => {}
                }
            }
        }
        _ => {}
    }

    Ok(Json(serde_json::json!({ "received": true })))
}

pub async fn refund_payment(
    State(state): State<Arc<PaymentState>>,
    Path(payment_id): Path<String>,
    Json(refund_request): Json<crate::models::RefundRequest>,
) -> Result<Json<PaymentResponse>, PaymentError> {
    let amount = refund_request.amount_cents;

    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| PaymentError::DatabaseError(e.to_string()))?;

    let payment = db::get_payment_by_id(&mut conn, &payment_id)
        .map_err(|_| PaymentError::NotFound(payment_id.clone()))?;

    if payment.status != "succeeded" {
        return Err(PaymentError::StripeError(
            "Payment not completed".to_string(),
        ));
    }

    let refund_amount = amount.unwrap_or(payment.amount_cents - payment.refunded_amount_cents);

    if let Some(pi_id) = &payment.provider_payment_id {
        let _refund_result = state
            .provider
            .refund(pi_id, Some(refund_amount as i64))
            .await
            .map_err(|e| PaymentError::StripeApiError(e.to_string()))?;
    }

    db::update_payment_refund(&mut conn, &payment_id, refund_amount)
        .map_err(|e| PaymentError::DatabaseError(e.to_string()))?;

    let updated = db::get_payment_by_id(&mut conn, &payment_id)?;

    Ok(Json(updated.into()))
}

pub async fn get_customer_payments(
    State(state): State<Arc<PaymentState>>,
    Path(customer_id): Path<String>,
) -> Result<Json<Vec<PaymentResponse>>, PaymentError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| PaymentError::DatabaseError(e.to_string()))?;

    let payments = db::get_payments_by_customer(&mut conn, &customer_id)?;

    Ok(Json(payments.into_iter().map(|p| p.into()).collect()))
}

pub async fn get_provider_payments(
    State(state): State<Arc<PaymentState>>,
    Path(provider_id): Path<String>,
) -> Result<Json<Vec<PaymentResponse>>, PaymentError> {
    let mut conn = state
        .db_pool
        .get()
        .map_err(|e| PaymentError::DatabaseError(e.to_string()))?;

    let payments = db::get_payments_by_provider(&mut conn, &provider_id)?;

    Ok(Json(payments.into_iter().map(|p| p.into()).collect()))
}

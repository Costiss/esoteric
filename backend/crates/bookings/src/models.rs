use diesel::pg::Pg;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BookingStatus {
    Requested,
    Confirmed,
    InProgress,
    Completed,
    Cancelled,
}

impl std::fmt::Display for BookingStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BookingStatus::Requested => write!(f, "requested"),
            BookingStatus::Confirmed => write!(f, "confirmed"),
            BookingStatus::InProgress => write!(f, "in_progress"),
            BookingStatus::Completed => write!(f, "completed"),
            BookingStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

impl std::str::FromStr for BookingStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "requested" => Ok(BookingStatus::Requested),
            "confirmed" => Ok(BookingStatus::Confirmed),
            "in_progress" => Ok(BookingStatus::InProgress),
            "completed" => Ok(BookingStatus::Completed),
            "cancelled" => Ok(BookingStatus::Cancelled),
            _ => Err(format!("Unknown booking status: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Selectable)]
#[diesel(table_name = db::schema::bookings)]
#[diesel(check_for_backend(Pg))]
pub struct Booking {
    pub id: String,
    pub service_id: String,
    pub customer_id: String,
    pub provider_id: String,
    pub start_ts: chrono::DateTime<chrono::Utc>,
    pub end_ts: chrono::DateTime<chrono::Utc>,
    pub status: String,
    pub price_cents: i32,
    pub currency: String,
    pub client_notes: Option<String>,
    pub provider_notes: Option<String>,
    pub cancellation_reason: Option<String>,
    pub cancelled_by: Option<String>,
    pub cancelled_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable)]
#[diesel(table_name = db::schema::bookings)]
pub struct NewBooking {
    pub id: String,
    pub service_id: String,
    pub customer_id: String,
    pub provider_id: String,
    pub start_ts: chrono::DateTime<chrono::Utc>,
    pub end_ts: chrono::DateTime<chrono::Utc>,
    pub status: String,
    pub price_cents: i32,
    pub currency: String,
    pub client_notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateBookingRequest {
    pub service_id: String,
    pub start_ts: String,
    pub client_notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateBookingRequest {
    pub status: Option<String>,
    pub provider_notes: Option<String>,
    pub start_ts: Option<String>,
    pub end_ts: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CancelBookingRequest {
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookingResponse {
    pub id: String,
    pub service_id: String,
    pub customer_id: String,
    pub provider_id: String,
    pub start_ts: String,
    pub end_ts: String,
    pub status: String,
    pub price_cents: i32,
    pub currency: String,
    pub client_notes: Option<String>,
    pub provider_notes: Option<String>,
    pub cancellation_reason: Option<String>,
    pub cancelled_by: Option<String>,
    pub cancelled_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Booking> for BookingResponse {
    fn from(booking: Booking) -> Self {
        Self {
            id: booking.id,
            service_id: booking.service_id,
            customer_id: booking.customer_id,
            provider_id: booking.provider_id,
            start_ts: booking.start_ts.to_rfc3339(),
            end_ts: booking.end_ts.to_rfc3339(),
            status: booking.status,
            price_cents: booking.price_cents,
            currency: booking.currency,
            client_notes: booking.client_notes,
            provider_notes: booking.provider_notes,
            cancellation_reason: booking.cancellation_reason,
            cancelled_by: booking.cancelled_by,
            cancelled_at: booking.cancelled_at.map(|t| t.to_rfc3339()),
            created_at: booking.created_at.to_rfc3339(),
            updated_at: booking.updated_at.to_rfc3339(),
        }
    }
}

use diesel::pg::Pg;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PaymentStatus {
    Pending,
    RequiresPaymentMethod,
    RequiresConfirmation,
    RequiresAction,
    Processing,
    Succeeded,
    Canceled,
    Refunded,
}

impl std::fmt::Display for PaymentStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PaymentStatus::Pending => write!(f, "pending"),
            PaymentStatus::RequiresPaymentMethod => write!(f, "requires_payment_method"),
            PaymentStatus::RequiresConfirmation => write!(f, "requires_confirmation"),
            PaymentStatus::RequiresAction => write!(f, "requires_action"),
            PaymentStatus::Processing => write!(f, "processing"),
            PaymentStatus::Succeeded => write!(f, "succeeded"),
            PaymentStatus::Canceled => write!(f, "canceled"),
            PaymentStatus::Refunded => write!(f, "refunded"),
        }
    }
}

impl std::str::FromStr for PaymentStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "pending" => Ok(PaymentStatus::Pending),
            "requires_payment_method" => Ok(PaymentStatus::RequiresPaymentMethod),
            "requires_confirmation" => Ok(PaymentStatus::RequiresConfirmation),
            "requires_action" => Ok(PaymentStatus::RequiresAction),
            "processing" => Ok(PaymentStatus::Processing),
            "succeeded" => Ok(PaymentStatus::Succeeded),
            "canceled" => Ok(PaymentStatus::Canceled),
            "refunded" => Ok(PaymentStatus::Refunded),
            _ => Err(format!("Unknown payment status: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Selectable)]
#[diesel(table_name = db::schema::payments)]
#[diesel(check_for_backend(Pg))]
pub struct Payment {
    pub id: String,
    pub booking_id: String,
    pub customer_id: String,
    pub provider_id: String,
    pub provider_type: String,
    pub provider_payment_id: Option<String>,
    pub provider_charge_id: Option<String>,
    pub amount_cents: i32,
    pub currency: String,
    pub status: String,
    pub payment_method_id: Option<String>,
    pub customer_email: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub refunded_amount_cents: i32,
    pub commission_amount_cents: i32,
    pub paid_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable)]
#[diesel(table_name = db::schema::payments)]
pub struct NewPayment {
    pub id: String,
    pub booking_id: String,
    pub customer_id: String,
    pub provider_id: String,
    pub provider_type: String,
    pub provider_payment_id: Option<String>,
    pub amount_cents: i32,
    pub currency: String,
    pub status: String,
    pub customer_email: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub commission_amount_cents: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePaymentRequest {
    pub booking_id: String,
    pub provider_type: Option<String>,
    pub customer_email: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdatePaymentRequest {
    pub provider_payment_id: Option<String>,
    pub provider_charge_id: Option<String>,
    pub status: Option<String>,
    pub payment_method_id: Option<String>,
    pub refunded_amount_cents: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentResponse {
    pub id: String,
    pub booking_id: String,
    pub customer_id: String,
    pub provider_id: String,
    pub provider_type: String,
    pub provider_payment_id: Option<String>,
    pub provider_charge_id: Option<String>,
    pub amount_cents: i32,
    pub currency: String,
    pub status: String,
    pub payment_method_id: Option<String>,
    pub customer_email: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub refunded_amount_cents: i32,
    pub commission_amount_cents: i32,
    pub paid_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Payment> for PaymentResponse {
    fn from(payment: Payment) -> Self {
        Self {
            id: payment.id,
            booking_id: payment.booking_id,
            customer_id: payment.customer_id,
            provider_id: payment.provider_id,
            provider_type: payment.provider_type,
            provider_payment_id: payment.provider_payment_id,
            provider_charge_id: payment.provider_charge_id,
            amount_cents: payment.amount_cents,
            currency: payment.currency,
            status: payment.status,
            payment_method_id: payment.payment_method_id,
            customer_email: payment.customer_email,
            metadata: payment.metadata,
            refunded_amount_cents: payment.refunded_amount_cents,
            commission_amount_cents: payment.commission_amount_cents,
            paid_at: payment
                .paid_at
                .map(|t: chrono::DateTime<chrono::Utc>| t.to_rfc3339()),
            created_at: payment.created_at.to_rfc3339(),
            updated_at: payment.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePaymentIntentResponse {
    pub client_secret: String,
    pub payment_id: String,
    pub provider_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefundRequest {
    pub amount_cents: Option<i32>,
}

pub const PLATFORM_COMMISSION_PERCENT: i32 = 10;

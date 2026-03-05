use crate::email::{EmailService, NoOpEmailProvider};
use crate::fcm::FcmConfig;
use axum::{
    extract::{Path, State},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

pub type DbPool = diesel::r2d2::Pool<diesel::r2d2::ConnectionManager<diesel::PgConnection>>;

#[derive(Clone)]
pub struct NotificationState {
    pub db_pool: DbPool,
    pub email_service: EmailService,
    pub fcm_service: Option<crate::fcm::FcmService>,
}

impl NotificationState {
    pub fn new(db_pool: DbPool) -> Self {
        Self {
            db_pool,
            email_service: EmailService::new(Box::new(NoOpEmailProvider)),
            fcm_service: None,
        }
    }

    pub fn with_fcm(db_pool: DbPool, fcm_config: FcmConfig) -> Self {
        let fcm_service = match crate::fcm::FcmService::new(fcm_config) {
            Ok(service) => Some(service),
            Err(e) => {
                log::warn!("Failed to initialize FCM service: {}", e);
                None
            }
        };
        Self {
            db_pool,
            email_service: EmailService::new(Box::new(NoOpEmailProvider)),
            fcm_service,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct RegisterPushTokenRequest {
    pub token: String,
    #[serde(default = "default_device_type")]
    pub device_type: String,
    pub device_id: Option<String>,
    pub app_version: Option<String>,
}

fn default_device_type() -> String {
    "ios".to_string()
}

#[derive(Debug, Serialize)]
pub struct PushTokenResponse {
    pub id: String,
    pub user_id: String,
    pub token: String,
    pub device_type: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateSupportTicketRequest {
    pub subject: String,
    pub description: String,
    #[serde(default = "default_category")]
    pub category: String,
    pub email: Option<String>,
}

fn default_category() -> String {
    "general".to_string()
}

#[derive(Debug, Serialize)]
pub struct SupportTicketResponse {
    pub id: String,
    pub subject: String,
    pub status: String,
    pub priority: String,
    pub category: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateSupportMessageRequest {
    pub message: String,
}

#[derive(Debug, Serialize)]
pub struct SupportMessageResponse {
    pub id: String,
    pub ticket_id: String,
    pub message: String,
    pub is_from_customer: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

pub async fn register_push_token(
    State(_state): State<Arc<NotificationState>>,
    Path(user_id): Path<String>,
    Json(req): Json<RegisterPushTokenRequest>,
) -> impl IntoResponse {
    let id = ulid::Ulid::new().to_string();
    let response = PushTokenResponse {
        id,
        user_id,
        token: req.token,
        device_type: req.device_type,
    };
    Json(ApiResponse::success(response))
}

pub async fn unregister_push_token(
    State(_state): State<Arc<NotificationState>>,
    Path((_user_id, _token)): Path<(String, String)>,
) -> impl IntoResponse {
    Json(ApiResponse::success("Token unregistered".to_string()))
}

pub async fn get_user_push_tokens(
    State(_state): State<Arc<NotificationState>>,
    Path(_user_id): Path<String>,
) -> impl IntoResponse {
    Json(ApiResponse::<Vec<PushTokenResponse>>::success(vec![]))
}

pub async fn create_support_ticket(
    State(_state): State<Arc<NotificationState>>,
    Json(req): Json<CreateSupportTicketRequest>,
) -> impl IntoResponse {
    let id = ulid::Ulid::new().to_string();
    let response = SupportTicketResponse {
        id,
        subject: req.subject,
        status: "open".to_string(),
        priority: "medium".to_string(),
        category: req.category,
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    Json(ApiResponse::success(response))
}

pub async fn get_support_ticket(
    State(_state): State<Arc<NotificationState>>,
    Path(_ticket_id): Path<String>,
) -> impl IntoResponse {
    Json(ApiResponse::<SupportTicketResponse>::error("Not implemented".to_string()))
}

pub async fn add_support_message(
    State(_state): State<Arc<NotificationState>>,
    Path(ticket_id): Path<String>,
    Json(req): Json<CreateSupportMessageRequest>,
) -> impl IntoResponse {
    let id = ulid::Ulid::new().to_string();
    let response = SupportMessageResponse {
        id,
        ticket_id,
        message: req.message,
        is_from_customer: true,
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    Json(ApiResponse::success(response))
}

pub async fn get_support_messages(
    State(_state): State<Arc<NotificationState>>,
    Path(_ticket_id): Path<String>,
) -> impl IntoResponse {
    Json(ApiResponse::<Vec<SupportMessageResponse>>::success(vec![]))
}

pub fn router() -> Router<Arc<NotificationState>> {
    Router::new()
        .route("/api/v1/users/:user_id/push-tokens", post(register_push_token))
        .route(
            "/api/v1/users/:user_id/push-tokens/:token",
            axum::routing::delete(unregister_push_token),
        )
        .route(
            "/api/v1/users/:user_id/push-tokens",
            get(get_user_push_tokens),
        )
        .route("/api/v1/support/tickets", post(create_support_ticket))
        .route(
            "/api/v1/support/tickets/:ticket_id",
            get(get_support_ticket),
        )
        .route(
            "/api/v1/support/tickets/:ticket_id/messages",
            post(add_support_message),
        )
        .route(
            "/api/v1/support/tickets/:ticket_id/messages",
            get(get_support_messages),
        )
}

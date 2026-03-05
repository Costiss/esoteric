use chrono::Utc;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Queryable, Selectable, Insertable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = db::schema::push_tokens)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct PushToken {
    pub id: String,
    pub user_id: String,
    pub token: String,
    pub device_type: String,
    pub device_id: Option<String>,
    pub app_version: Option<String>,
    pub is_active: bool,
    pub last_used_at: Option<chrono::DateTime<Utc>>,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
}

#[derive(Insertable, Debug, Deserialize)]
#[diesel(table_name = db::schema::push_tokens)]
pub struct NewPushToken {
    pub id: String,
    pub user_id: String,
    pub token: String,
    pub device_type: String,
    pub device_id: Option<String>,
    pub app_version: Option<String>,
}

impl NewPushToken {
    pub fn new(
        user_id: String,
        token: String,
        device_type: String,
        device_id: Option<String>,
        app_version: Option<String>,
    ) -> Self {
        Self {
            id: ulid::Ulid::new().to_string(),
            user_id,
            token,
            device_type,
            device_id,
            app_version,
        }
    }
}

#[derive(Queryable, Selectable, Insertable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = db::schema::support_tickets)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct SupportTicket {
    pub id: String,
    pub user_id: Option<String>,
    pub subject: String,
    pub description: String,
    pub status: String,
    pub priority: String,
    pub category: String,
    pub email: Option<String>,
    pub resolved_at: Option<chrono::DateTime<Utc>>,
    pub created_at: chrono::DateTime<Utc>,
    pub updated_at: chrono::DateTime<Utc>,
}

#[derive(Insertable, Debug, Deserialize)]
#[diesel(table_name = db::schema::support_tickets)]
pub struct NewSupportTicket {
    pub id: String,
    pub user_id: Option<String>,
    pub subject: String,
    pub description: String,
    pub status: String,
    pub priority: String,
    pub category: String,
    pub email: Option<String>,
}

impl NewSupportTicket {
    pub fn new(
        user_id: Option<String>,
        subject: String,
        description: String,
        category: String,
        email: Option<String>,
    ) -> Self {
        Self {
            id: ulid::Ulid::new().to_string(),
            user_id,
            subject,
            description,
            status: "open".to_string(),
            priority: "medium".to_string(),
            category,
            email,
        }
    }
}

#[derive(Queryable, Selectable, Insertable, Debug, Clone, Serialize, Deserialize)]
#[diesel(table_name = db::schema::support_messages)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct SupportMessage {
    pub id: String,
    pub ticket_id: String,
    pub user_id: Option<String>,
    pub message: String,
    pub is_from_customer: bool,
    pub created_at: chrono::DateTime<Utc>,
}

#[derive(Insertable, Debug, Deserialize)]
#[diesel(table_name = db::schema::support_messages)]
pub struct NewSupportMessage {
    pub id: String,
    pub ticket_id: String,
    pub user_id: Option<String>,
    pub message: String,
    pub is_from_customer: bool,
}

impl NewSupportMessage {
    pub fn new(
        ticket_id: String,
        user_id: Option<String>,
        message: String,
        is_from_customer: bool,
    ) -> Self {
        Self {
            id: ulid::Ulid::new().to_string(),
            ticket_id,
            user_id,
            message,
            is_from_customer,
        }
    }
}

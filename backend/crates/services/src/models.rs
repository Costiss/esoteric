use diesel::pg::Pg;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Selectable)]
#[diesel(table_name = db::schema::services)]
#[diesel(check_for_backend(Pg))]
pub struct Service {
    pub id: String,
    pub provider_id: String,
    pub title: String,
    pub description: Option<String>,
    pub duration_minutes: i32,
    pub price_cents: i32,
    pub currency: String,
    pub tags: Option<Vec<String>>,
    pub metadata: Option<serde_json::Value>,
    pub is_published: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable)]
#[diesel(table_name = db::schema::services)]
pub struct NewService {
    pub id: String,
    pub provider_id: String,
    pub title: String,
    pub description: Option<String>,
    pub duration_minutes: i32,
    pub price_cents: i32,
    pub currency: String,
    pub tags: Option<Vec<String>>,
    pub metadata: Option<serde_json::Value>,
    pub is_published: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateServiceRequest {
    pub title: String,
    pub description: Option<String>,
    pub duration_minutes: i32,
    pub price_cents: i32,
    pub currency: Option<String>,
    pub tags: Option<Vec<String>>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateServiceRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub duration_minutes: Option<i32>,
    pub price_cents: Option<i32>,
    pub currency: Option<String>,
    pub tags: Option<Vec<String>>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceResponse {
    pub id: String,
    pub provider_id: String,
    pub title: String,
    pub description: Option<String>,
    pub duration_minutes: i32,
    pub price_cents: i32,
    pub currency: String,
    pub tags: Option<Vec<String>>,
    pub metadata: Option<serde_json::Value>,
    pub is_published: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Service> for ServiceResponse {
    fn from(service: Service) -> Self {
        Self {
            id: service.id,
            provider_id: service.provider_id,
            title: service.title,
            description: service.description,
            duration_minutes: service.duration_minutes,
            price_cents: service.price_cents,
            currency: service.currency,
            tags: service.tags,
            metadata: service.metadata,
            is_published: service.is_published,
            created_at: service.created_at.to_rfc3339(),
            updated_at: service.updated_at.to_rfc3339(),
        }
    }
}

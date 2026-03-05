use diesel::pg::Pg;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Selectable)]
#[diesel(table_name = db::schema::providers)]
#[diesel(check_for_backend(Pg))]
pub struct Provider {
    pub id: String,
    pub user_id: String,
    pub display_name: String,
    pub bio: Option<String>,
    pub working_hours: Option<serde_json::Value>,
    pub availability_settings: Option<serde_json::Value>,
    pub is_verified: bool,
    pub is_active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Insertable)]
#[diesel(table_name = db::schema::providers)]
pub struct NewProvider {
    pub id: String,
    pub user_id: String,
    pub display_name: String,
    pub bio: Option<String>,
    pub working_hours: Option<serde_json::Value>,
    pub availability_settings: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProviderRequest {
    pub display_name: String,
    pub bio: Option<String>,
    pub working_hours: Option<serde_json::Value>,
    pub availability_settings: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProviderRequest {
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub working_hours: Option<serde_json::Value>,
    pub availability_settings: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderResponse {
    pub id: String,
    pub user_id: String,
    pub display_name: String,
    pub bio: Option<String>,
    pub working_hours: Option<serde_json::Value>,
    pub availability_settings: Option<serde_json::Value>,
    pub is_verified: bool,
    pub is_active: bool,
    pub created_at: String,
}

impl From<Provider> for ProviderResponse {
    fn from(provider: Provider) -> Self {
        Self {
            id: provider.id,
            user_id: provider.user_id,
            display_name: provider.display_name,
            bio: provider.bio,
            working_hours: provider.working_hours,
            availability_settings: provider.availability_settings,
            is_verified: provider.is_verified,
            is_active: provider.is_active,
            created_at: provider.created_at.to_rfc3339(),
        }
    }
}

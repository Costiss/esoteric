//! Authentication crate - OAuth2 authorization server implementation

pub mod jwt;
pub mod pkce;
pub mod models;
pub mod handlers;
pub mod db_models;

#[cfg(test)]
mod integration_tests;

pub use jwt::{JwtService, JwtServiceError, AccessTokenClaims};
pub use pkce::{verify_pkce_challenge, PkceChallengeMethod};
pub use models::*;
pub use db_models::*;

use common::cache::Cache;
use diesel::r2d2::{ConnectionManager, Pool};
use diesel::PgConnection;
use std::sync::Arc;

pub type DbPool = Pool<ConnectionManager<PgConnection>>;

pub struct AuthState {
    pub jwt_service: JwtService,
    pub cache: Arc<dyn Cache>,
    pub db_pool: Option<DbPool>,
}

impl AuthState {
    pub fn new(jwt_service: JwtService, cache: Arc<dyn Cache>) -> Self {
        Self { 
            jwt_service, 
            cache,
            db_pool: None,
        }
    }

    pub fn with_db_pool(jwt_service: JwtService, cache: Arc<dyn Cache>, db_pool: DbPool) -> Self {
        Self {
            jwt_service,
            cache,
            db_pool: Some(db_pool),
        }
    }
}

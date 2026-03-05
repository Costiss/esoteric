//! Authentication crate - OAuth2 authorization server implementation

pub mod db_models;
pub mod handlers;
pub mod jwt;
pub mod models;
pub mod pkce;

#[cfg(test)]
mod integration_tests;

pub use db_models::*;
pub use jwt::{AccessTokenClaims, JwtService, JwtServiceError};
pub use models::*;
pub use pkce::{verify_pkce_challenge, PkceChallengeMethod};

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

//! Authentication crate - OAuth2 authorization server implementation

pub mod jwt;
pub mod pkce;
pub mod models;
pub mod handlers;

#[cfg(test)]
mod integration_tests;

pub use jwt::{JwtService, JwtServiceError, AccessTokenClaims};
pub use pkce::{verify_pkce_challenge, PkceChallengeMethod};
pub use models::*;

use common::cache::Cache;
use std::sync::Arc;

pub struct AuthState {
    pub jwt_service: JwtService,
    pub cache: Arc<dyn Cache>,
}

impl AuthState {
    pub fn new(jwt_service: JwtService, cache: Arc<dyn Cache>) -> Self {
        Self { jwt_service, cache }
    }
}

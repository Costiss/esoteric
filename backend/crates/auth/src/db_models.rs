use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::Serialize;
use sha2::{Digest, Sha256};

use db::schema::refresh_tokens;

/// Model representing a refresh token in the database
#[derive(Debug, Queryable, Serialize)]
pub struct RefreshToken {
    pub id: String,
    pub user_id: String,
    pub client_id: String,
    pub token_hash: String,
    pub scopes: serde_json::Value,
    pub expires_at: DateTime<Utc>,
    pub revoked: bool,
    pub created_at: DateTime<Utc>,
}

/// Model for inserting a new refresh token
#[derive(Debug, Insertable)]
#[diesel(table_name = refresh_tokens)]
pub struct NewRefreshToken {
    pub id: String,
    pub user_id: String,
    pub client_id: String,
    pub token_hash: String,
    pub scopes: serde_json::Value,
    pub expires_at: DateTime<Utc>,
}

/// Hash a raw refresh token for storage
/// Uses SHA256 to create a fixed-length hash
pub fn hash_token(token: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Generate a secure random refresh token
/// Returns the raw token (to be sent to client) and its hash (to be stored)
pub fn generate_refresh_token() -> (String, String) {
    use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
    use rand::Rng;

    // Generate 32 random bytes and encode as base64url
    let random_bytes: Vec<u8> = (0..32).map(|_| rand::thread_rng().gen::<u8>()).collect();
    let token = URL_SAFE_NO_PAD.encode(&random_bytes);
    let hash = hash_token(&token);

    (token, hash)
}

/// Create a new refresh token in the database
pub fn create_refresh_token(
    conn: &mut PgConnection,
    user_id: &str,
    client_id: &str,
    scopes: &[String],
    expires_in_days: i64,
) -> Result<(RefreshToken, String), diesel::result::Error> {
    use diesel::RunQueryDsl;

    let id = ulid::Ulid::new().to_string();
    let (raw_token, token_hash) = generate_refresh_token();
    let expires_at = Utc::now() + chrono::Duration::days(expires_in_days);

    let new_token = NewRefreshToken {
        id: id.clone(),
        user_id: user_id.to_string(),
        client_id: client_id.to_string(),
        token_hash: token_hash.clone(),
        scopes: serde_json::to_value(scopes).unwrap_or_default(),
        expires_at,
    };

    diesel::insert_into(refresh_tokens::table)
        .values(&new_token)
        .execute(conn)?;

    // Fetch the created token
    let token = refresh_tokens::table.find(&id).first(conn)?;

    Ok((token, raw_token))
}

/// Validate a refresh token
/// Returns the token if valid, None otherwise
pub fn validate_refresh_token(
    conn: &mut PgConnection,
    raw_token: &str,
    client_id: &str,
) -> Result<Option<RefreshToken>, diesel::result::Error> {
    use diesel::ExpressionMethods;
    use diesel::RunQueryDsl;

    let token_hash = hash_token(raw_token);
    let now = Utc::now();

    let result = refresh_tokens::table
        .filter(refresh_tokens::token_hash.eq(&token_hash))
        .filter(refresh_tokens::client_id.eq(client_id))
        .filter(refresh_tokens::revoked.eq(false))
        .filter(refresh_tokens::expires_at.gt(now))
        .first(conn)
        .optional()?;

    Ok(result)
}

/// Revoke a refresh token
pub fn revoke_refresh_token(
    conn: &mut PgConnection,
    raw_token: &str,
) -> Result<bool, diesel::result::Error> {
    use diesel::ExpressionMethods;
    use diesel::RunQueryDsl;

    let token_hash = hash_token(raw_token);

    let affected = diesel::update(
        refresh_tokens::table
            .filter(refresh_tokens::token_hash.eq(&token_hash))
            .filter(refresh_tokens::revoked.eq(false)),
    )
    .set(refresh_tokens::revoked.eq(true))
    .execute(conn)?;

    Ok(affected > 0)
}

/// Revoke all refresh tokens for a user
pub fn revoke_all_user_tokens(
    conn: &mut PgConnection,
    user_id: &str,
) -> Result<usize, diesel::result::Error> {
    use diesel::ExpressionMethods;
    use diesel::RunQueryDsl;

    let affected = diesel::update(
        refresh_tokens::table
            .filter(refresh_tokens::user_id.eq(user_id))
            .filter(refresh_tokens::revoked.eq(false)),
    )
    .set(refresh_tokens::revoked.eq(true))
    .execute(conn)?;

    Ok(affected)
}

/// Get scopes from a refresh token
pub fn get_token_scopes(token: &RefreshToken) -> Vec<String> {
    match &token.scopes {
        serde_json::Value::Array(arr) => arr
            .iter()
            .filter_map(|v| v.as_str().map(String::from))
            .collect(),
        _ => vec![],
    }
}

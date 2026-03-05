//! Integration tests for OAuth2 authorization server
//! 
//! These tests use MockCache to test the full authorization code flow
//! without requiring external dependencies.

#[cfg(test)]
mod tests {
    use crate::{
        jwt::{generate_rsa_keypair, JwtService},
        models::AuthorizationCodeData,
        pkce::{generate_pkce_challenge, verify_pkce_challenge, PkceChallengeMethod},
        AuthState,
    };
    use common::cache::MockCache;
    use std::sync::Arc;
    use std::time::Duration;

    fn create_test_auth_state() -> Arc<AuthState> {
        let (private_key, _) = generate_rsa_keypair().unwrap();
        let jwt_service = JwtService::new(
            &private_key,
            "https://test.esotheric.com".to_string(),
            "test-client".to_string(),
        )
        .unwrap();

        let cache = Arc::new(MockCache::new());

        Arc::new(AuthState::new(jwt_service, cache))
    }

    #[tokio::test]
    async fn test_authorization_code_storage_and_retrieval() {
        let auth_state = create_test_auth_state();

        // Create authorization code data
        let code = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        let auth_code_data = AuthorizationCodeData {
            user_id: "user_123".to_string(),
            client_id: "test-client".to_string(),
            redirect_uri: "https://app.esotheric.com/callback".to_string(),
            scopes: vec!["read".to_string(), "write".to_string()],
            code_challenge: Some("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM".to_string()),
            code_challenge_method: Some("S256".to_string()),
            created_at: chrono::Utc::now().timestamp(),
        };

        // Store in cache
        let cache_key = format!("code:{}", code);
        auth_state
            .cache
            .set(&cache_key, &auth_code_data.to_json().unwrap(), Duration::from_secs(600))
            .await
            .unwrap();

        // Retrieve from cache
        let retrieved = auth_state
            .cache
            .get(&cache_key)
            .await
            .unwrap()
            .expect("Code should exist");

        let retrieved_data = AuthorizationCodeData::from_json(&retrieved).unwrap();
        assert_eq!(retrieved_data.user_id, auth_code_data.user_id);
        assert_eq!(retrieved_data.client_id, auth_code_data.client_id);
        assert_eq!(retrieved_data.scopes, auth_code_data.scopes);

        // Atomic get and delete (simulates code consumption)
        let consumed = auth_state
            .cache
            .get_and_delete(&cache_key)
            .await
            .unwrap()
            .expect("Code should exist");

        let consumed_data = AuthorizationCodeData::from_json(&consumed).unwrap();
        assert_eq!(consumed_data.user_id, auth_code_data.user_id);

        // Second get should fail (code already used)
        let second_attempt = auth_state.cache.get(&cache_key).await.unwrap();
        assert!(second_attempt.is_none(), "Code should be deleted after consumption");
    }

    #[tokio::test]
    async fn test_authorization_code_ttl_expiration() {
        let auth_state = create_test_auth_state();

        let code = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        let auth_code_data = AuthorizationCodeData {
            user_id: "user_123".to_string(),
            client_id: "test-client".to_string(),
            redirect_uri: "https://app.esotheric.com/callback".to_string(),
            scopes: vec!["read".to_string()],
            code_challenge: None,
            code_challenge_method: None,
            created_at: chrono::Utc::now().timestamp(),
        };

        // Store with 1 second TTL
        let cache_key = format!("code:{}", code);
        auth_state
            .cache
            .set(&cache_key, &auth_code_data.to_json().unwrap(), Duration::from_secs(1))
            .await
            .unwrap();

        // Should exist immediately
        let exists = auth_state.cache.get(&cache_key).await.unwrap();
        assert!(exists.is_some());

        // Wait for expiration
        tokio::time::sleep(Duration::from_secs(2)).await;

        // Should be expired
        let expired = auth_state.cache.get(&cache_key).await.unwrap();
        assert!(expired.is_none(), "Code should expire after TTL");
    }

    #[tokio::test]
    async fn test_full_authorization_flow_with_pkce() {
        let auth_state = create_test_auth_state();

        // Step 1: Generate PKCE challenge
        let code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
        let code_challenge = generate_pkce_challenge(code_verifier);

        // Step 2: Store authorization code with PKCE
        let code = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        let auth_code_data = AuthorizationCodeData {
            user_id: "user_123".to_string(),
            client_id: "test-client".to_string(),
            redirect_uri: "https://app.esotheric.com/callback".to_string(),
            scopes: vec!["read".to_string(), "write".to_string()],
            code_challenge: Some(code_challenge.clone()),
            code_challenge_method: Some("S256".to_string()),
            created_at: chrono::Utc::now().timestamp(),
        };

        let cache_key = format!("code:{}", code);
        auth_state
            .cache
            .set(&cache_key, &auth_code_data.to_json().unwrap(), Duration::from_secs(600))
            .await
            .unwrap();

        // Step 3: Retrieve and verify PKCE
        let stored_json = auth_state
            .cache
            .get_and_delete(&cache_key)
            .await
            .unwrap()
            .expect("Code should exist");

        let stored_data = AuthorizationCodeData::from_json(&stored_json).unwrap();

        // Verify PKCE challenge
        assert!(stored_data.code_challenge.is_some());
        assert_eq!(stored_data.code_challenge_method.as_deref(), Some("S256"));

        let stored_challenge = stored_data.code_challenge.unwrap();
        assert!(verify_pkce_challenge(
            code_verifier,
            &stored_challenge,
            &PkceChallengeMethod::S256
        ), "PKCE verification should succeed");

        // Step 4: Generate access token
        let access_token = auth_state
            .jwt_service
            .generate_access_token(
                &stored_data.user_id,
                &stored_data.client_id,
                &stored_data.scopes,
                3600,
            )
            .unwrap();

        assert!(!access_token.is_empty());

        // Step 5: Validate access token
        let claims = auth_state
            .jwt_service
            .validate_access_token(&access_token)
            .unwrap();

        assert_eq!(claims.sub, stored_data.user_id);
        assert_eq!(claims.client_id, stored_data.client_id);
        assert_eq!(claims.scope, "read write");
    }

    #[tokio::test]
    async fn test_pkce_verification_failure() {
        let auth_state = create_test_auth_state();

        // Generate valid challenge
        let code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
        let code_challenge = generate_pkce_challenge(code_verifier);

        // Store authorization code
        let code = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        let auth_code_data = AuthorizationCodeData {
            user_id: "user_123".to_string(),
            client_id: "test-client".to_string(),
            redirect_uri: "https://app.esotheric.com/callback".to_string(),
            scopes: vec!["read".to_string()],
            code_challenge: Some(code_challenge),
            code_challenge_method: Some("S256".to_string()),
            created_at: chrono::Utc::now().timestamp(),
        };

        let cache_key = format!("code:{}", code);
        auth_state
            .cache
            .set(&cache_key, &auth_code_data.to_json().unwrap(), Duration::from_secs(600))
            .await
            .unwrap();

        // Retrieve stored data
        let stored_json = auth_state
            .cache
            .get_and_delete(&cache_key)
            .await
            .unwrap()
            .expect("Code should exist");

        let stored_data = AuthorizationCodeData::from_json(&stored_json).unwrap();
        let stored_challenge = stored_data.code_challenge.unwrap();

        // Try to verify with wrong verifier
        let wrong_verifier = "wrong_verifier";
        assert!(
            !verify_pkce_challenge(wrong_verifier, &stored_challenge, &PkceChallengeMethod::S256),
            "PKCE verification should fail with wrong verifier"
        );
    }

    #[tokio::test]
    async fn test_jwks_generation() {
        let auth_state = create_test_auth_state();

        let jwks = auth_state.jwt_service.get_jwks();

        assert!(jwks["keys"].is_array());
        let keys = jwks["keys"].as_array().unwrap();
        assert_eq!(keys.len(), 1);

        let key = &keys[0];
        assert_eq!(key["kty"], "RSA");
        assert_eq!(key["alg"], "RS256");
        assert_eq!(key["use"], "sig");
        assert!(key["n"].is_string());
        assert!(key["e"].is_string());
    }

    #[tokio::test]
    async fn test_client_id_validation() {
        let auth_state = create_test_auth_state();

        // Store code for client A
        let code = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        let auth_code_data = AuthorizationCodeData {
            user_id: "user_123".to_string(),
            client_id: "client-a".to_string(),
            redirect_uri: "https://app.esotheric.com/callback".to_string(),
            scopes: vec!["read".to_string()],
            code_challenge: None,
            code_challenge_method: None,
            created_at: chrono::Utc::now().timestamp(),
        };

        let cache_key = format!("code:{}", code);
        auth_state
            .cache
            .set(&cache_key, &auth_code_data.to_json().unwrap(), Duration::from_secs(600))
            .await
            .unwrap();

        // Client B tries to use the code (should be validated in handler)
        let stored_data = auth_state
            .cache
            .get_and_delete(&cache_key)
            .await
            .unwrap()
            .expect("Code should exist");

        let auth_data = AuthorizationCodeData::from_json(&stored_data).unwrap();
        assert_eq!(auth_data.client_id, "client-a");
        assert_ne!(auth_data.client_id, "client-b");
    }
}

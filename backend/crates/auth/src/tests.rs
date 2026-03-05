#[cfg(test)]
mod tests {
    use super::*;
    use crate::jwt::{generate_rsa_keypair, JwtService};
    use crate::pkce::{generate_pkce_challenge, verify_pkce_challenge, PkceChallengeMethod};

    #[test]
    fn test_generate_and_validate_jwt() {
        let (private_key, _public_key) = generate_rsa_keypair().unwrap();
        let jwt_service = JwtService::new(
            &private_key,
            "https://api.esotheric.com".to_string(),
            "esotheric-api".to_string(),
        )
        .unwrap();

        let user_id = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
        let client_id = "mobile-app";
        let scopes = vec!["read".to_string(), "write".to_string()];

        let token = jwt_service
            .generate_access_token(user_id, client_id, &scopes, 3600)
            .unwrap();

        let claims = jwt_service.validate_access_token(&token).unwrap();

        assert_eq!(claims.sub, user_id);
        assert_eq!(claims.client_id, client_id);
        assert_eq!(claims.scope, "read write");
        assert_eq!(claims.iss, "https://api.esotheric.com");
        assert_eq!(claims.aud, "esotheric-api");
    }

    #[test]
    fn test_jwks_generation() {
        let (private_key, _public_key) = generate_rsa_keypair().unwrap();
        let jwt_service = JwtService::new(
            &private_key,
            "https://api.esotheric.com".to_string(),
            "esotheric-api".to_string(),
        )
        .unwrap();

        let jwks = jwt_service.get_jwks();

        assert!(jwks["keys"].is_array());
        let keys = jwks["keys"].as_array().unwrap();
        assert_eq!(keys.len(), 1);
        assert_eq!(keys[0]["kty"], "RSA");
        assert_eq!(keys[0]["alg"], "RS256");
        assert!(keys[0]["n"].is_string());
        assert!(keys[0]["e"].is_string());
    }

    #[test]
    fn test_pkce_s256_flow() {
        let code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
        let code_challenge = generate_pkce_challenge(code_verifier);

        assert!(verify_pkce_challenge(
            code_verifier,
            &code_challenge,
            &PkceChallengeMethod::S256
        ));

        assert!(!verify_pkce_challenge(
            "wrong_verifier",
            &code_challenge,
            &PkceChallengeMethod::S256
        ));
    }

    #[test]
    fn test_pkce_plain_flow() {
        let code_verifier = "plain_verifier_test";

        assert!(verify_pkce_challenge(
            code_verifier,
            code_verifier,
            &PkceChallengeMethod::Plain
        ));

        assert!(!verify_pkce_challenge(
            "wrong_verifier",
            code_verifier,
            &PkceChallengeMethod::Plain
        ));
    }

    #[test]
    fn test_authorization_code_data_serialization() {
        use crate::models::AuthorizationCodeData;

        let auth_code = AuthorizationCodeData {
            user_id: "01ARZ3NDEKTSV4RRFFQ69G5FAV".to_string(),
            client_id: "mobile-app".to_string(),
            redirect_uri: "https://app.esotheric.com/callback".to_string(),
            scopes: vec!["read".to_string(), "write".to_string()],
            code_challenge: Some("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM".to_string()),
            code_challenge_method: Some("S256".to_string()),
            created_at: 1234567890,
        };

        let json = auth_code.to_json().unwrap();
        let deserialized = AuthorizationCodeData::from_json(&json).unwrap();

        assert_eq!(auth_code.user_id, deserialized.user_id);
        assert_eq!(auth_code.client_id, deserialized.client_id);
        assert_eq!(auth_code.redirect_uri, deserialized.redirect_uri);
        assert_eq!(auth_code.scopes, deserialized.scopes);
        assert_eq!(auth_code.code_challenge, deserialized.code_challenge);
    }
}

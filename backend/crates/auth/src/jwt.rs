use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use chrono::{Duration, Utc};
use jsonwebtoken::{
    decode, encode, errors::Error as JwtError, Algorithm, DecodingKey, EncodingKey, Header,
    Validation,
};
use rsa::{
    pkcs8::{DecodePrivateKey, DecodePublicKey, EncodePrivateKey, EncodePublicKey, LineEnding},
    traits::PublicKeyParts,
    RsaPrivateKey, RsaPublicKey,
};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum JwtServiceError {
    #[error("JWT encoding error: {0}")]
    Encoding(#[from] JwtError),
    #[error("RSA key error: {0}")]
    RsaKey(#[from] rsa::Error),
    #[error("PKCS8 error: {0}")]
    Pkcs8Error(#[from] rsa::pkcs8::Error),
    #[error("SPKI error: {0}")]
    SpkiError(#[from] rsa::pkcs8::spki::Error),
    #[error("Invalid token")]
    InvalidToken,
    #[error("Token expired")]
    TokenExpired,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AccessTokenClaims {
    pub sub: String,
    pub aud: String,
    pub iss: String,
    pub exp: usize,
    pub iat: usize,
    pub scope: String,
    pub client_id: String,
}

pub struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    public_key_pem: String,
    issuer: String,
    audience: String,
}

impl JwtService {
    pub fn new(
        private_key_pem: &str,
        issuer: String,
        audience: String,
    ) -> Result<Self, JwtServiceError> {
        let encoding_key = EncodingKey::from_rsa_pem(private_key_pem.as_bytes())?;

        let private_key = RsaPrivateKey::from_pkcs8_pem(private_key_pem)?;
        let public_key = RsaPublicKey::from(&private_key);
        let public_key_pem = public_key.to_public_key_pem(LineEnding::default())?;

        // Create decoding key from public key
        let decoding_key = DecodingKey::from_rsa_pem(public_key_pem.as_bytes())?;

        Ok(Self {
            encoding_key,
            decoding_key,
            public_key_pem,
            issuer,
            audience,
        })
    }

    pub fn generate_access_token(
        &self,
        user_id: &str,
        client_id: &str,
        scopes: &[String],
        expires_in_seconds: i64,
    ) -> Result<String, JwtServiceError> {
        let now = Utc::now();
        let exp = now + Duration::seconds(expires_in_seconds);

        let claims = AccessTokenClaims {
            sub: user_id.to_string(),
            aud: self.audience.clone(),
            iss: self.issuer.clone(),
            exp: exp.timestamp() as usize,
            iat: now.timestamp() as usize,
            scope: scopes.join(" "),
            client_id: client_id.to_string(),
        };

        let token = encode(&Header::new(Algorithm::RS256), &claims, &self.encoding_key)?;
        Ok(token)
    }

    pub fn validate_access_token(&self, token: &str) -> Result<AccessTokenClaims, JwtServiceError> {
        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_audience(&[&self.audience]);
        validation.set_issuer(&[&self.issuer]);
        validation.set_required_spec_claims(&["exp", "iat", "sub", "aud", "iss"]);

        let token_data = decode::<AccessTokenClaims>(token, &self.decoding_key, &validation)?;
        Ok(token_data.claims)
    }

    pub fn get_jwks(&self) -> serde_json::Value {
        let jwk = serde_json::json!({
            "keys": [{
                "kty": "RSA",
                "alg": "RS256",
                "use": "sig",
                "n": self.get_modulus_base64(),
                "e": self.get_exponent_base64(),
            }]
        });
        jwk
    }

    fn get_modulus_base64(&self) -> String {
        let public_key = RsaPublicKey::from_public_key_pem(&self.public_key_pem).unwrap();
        let n = public_key.n().to_bytes_be();
        BASE64.encode(n)
    }

    fn get_exponent_base64(&self) -> String {
        let public_key = RsaPublicKey::from_public_key_pem(&self.public_key_pem).unwrap();
        let e = public_key.e().to_bytes_be();
        BASE64.encode(e)
    }
}

pub fn generate_rsa_keypair() -> Result<(String, String), JwtServiceError> {
    use rand::rngs::OsRng;

    let mut rng = OsRng;
    let bits = 2048;
    let private_key = RsaPrivateKey::new(&mut rng, bits)?;
    let public_key = RsaPublicKey::from(&private_key);

    let private_pem = private_key.to_pkcs8_pem(LineEnding::default())?;
    let public_pem = public_key.to_public_key_pem(LineEnding::default())?;

    Ok((private_pem.to_string(), public_pem))
}

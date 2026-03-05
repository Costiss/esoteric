use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone)]
pub enum PkceChallengeMethod {
    S256,
    Plain,
}

impl PkceChallengeMethod {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "S256" => Some(Self::S256),
            "plain" => Some(Self::Plain),
            _ => None,
        }
    }
}

pub fn verify_pkce_challenge(
    code_verifier: &str,
    code_challenge: &str,
    method: &PkceChallengeMethod,
) -> bool {
    match method {
        PkceChallengeMethod::S256 => {
            let expected_challenge = compute_s256_challenge(code_verifier);
            expected_challenge == code_challenge
        }
        PkceChallengeMethod::Plain => code_verifier == code_challenge,
    }
}

fn compute_s256_challenge(code_verifier: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(code_verifier.as_bytes());
    let hash = hasher.finalize();
    URL_SAFE_NO_PAD.encode(hash)
}

pub fn generate_pkce_challenge(code_verifier: &str) -> String {
    compute_s256_challenge(code_verifier)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verify_s256_challenge() {
        let verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
        let challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

        assert!(verify_pkce_challenge(
            verifier,
            challenge,
            &PkceChallengeMethod::S256
        ));
    }

    #[test]
    fn test_verify_plain_challenge() {
        let verifier = "test_verifier";
        let challenge = "test_verifier";

        assert!(verify_pkce_challenge(
            verifier,
            challenge,
            &PkceChallengeMethod::Plain
        ));
    }

    #[test]
    fn test_invalid_challenge() {
        let verifier = "test_verifier";
        let challenge = "wrong_challenge";

        assert!(!verify_pkce_challenge(
            verifier,
            challenge,
            &PkceChallengeMethod::S256
        ));
    }
}

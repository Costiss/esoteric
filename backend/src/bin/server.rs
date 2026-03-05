use axum::{
    routing::{get, post},
    Router,
};
use auth::{handlers, AuthState, JwtService};
use common::{cache::{ValkeyCache, ValkeyConfig}, init_logging};
use std::env;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    init_logging();

    // Initialize cache (Valkey/Redis)
    let cache_url = env::var("VALKEY_URL")
        .or_else(|_| env::var("REDIS_URL"))
        .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    
    let cache = Arc::new(
        ValkeyCache::new(ValkeyConfig { url: cache_url })
            .expect("Failed to connect to cache")
    );

    // Initialize JWT service with RSA keypair
    let jwt_private_key = env::var("JWT_PRIVATE_KEY")
        .unwrap_or_else(|_| {
            // Generate a new keypair for development
            let (private_key, _) = auth::jwt::generate_rsa_keypair()
                .expect("Failed to generate RSA keypair");
            private_key
        });
    
    let jwt_issuer = env::var("JWT_ISSUER")
        .unwrap_or_else(|_| "https://api.esotheric.com".to_string());
    
    let jwt_audience = env::var("JWT_AUDIENCE")
        .unwrap_or_else(|_| "esotheric-mobile".to_string());

    let jwt_service = JwtService::new(&jwt_private_key, jwt_issuer, jwt_audience)
        .expect("Failed to initialize JWT service");

    // Create auth state
    let auth_state = Arc::new(AuthState::new(jwt_service, cache));

    // Build router with auth routes
    let app = Router::new()
        .route("/", get(|| async { "Hello, Esotheric!" }))
        // OAuth2 endpoints
        .route("/oauth/authorize", get(handlers::authorize))
        .route("/oauth/token", post(handlers::token))
        .route("/oauth/revoke", post(handlers::revoke))
        .route("/.well-known/jwks.json", get(handlers::jwks))
        .with_state(auth_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    println!("Server running on http://0.0.0.0:3000");
    println!("OAuth2 endpoints:");
    println!("  - Authorization: GET /oauth/authorize");
    println!("  - Token: POST /oauth/token");
    println!("  - Revoke: POST /oauth/revoke");
    println!("  - JWKS: GET /.well-known/jwks.json");

    axum::serve(listener, app).await.unwrap();
}

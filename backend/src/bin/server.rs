use auth::{handlers as auth_handlers, AuthState, JwtService};
use axum::{
    routing::{delete, get, post, put},
    Router,
};
use common::{
    cache::{ValkeyCache, ValkeyConfig},
    init_logging,
};
use diesel::r2d2::ConnectionManager;
use diesel::PgConnection;
use providers::handlers as provider_handlers;
use services::handlers as service_handlers;
use std::env;
use std::sync::Arc;
use users::handlers as user_handlers;

#[tokio::main]
async fn main() {
    init_logging();

    // Initialize cache (Valkey/Redis)
    let cache_url = env::var("VALKEY_URL")
        .or_else(|_| env::var("REDIS_URL"))
        .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());

    let cache = Arc::new(
        ValkeyCache::new(ValkeyConfig { url: cache_url }).expect("Failed to connect to cache"),
    );

    // Initialize JWT service with RSA keypair
    let jwt_private_key = env::var("JWT_PRIVATE_KEY").unwrap_or_else(|_| {
        let (private_key, _) =
            auth::jwt::generate_rsa_keypair().expect("Failed to generate RSA keypair");
        private_key
    });

    let jwt_issuer =
        env::var("JWT_ISSUER").unwrap_or_else(|_| "https://api.esotheric.com".to_string());

    let jwt_audience = env::var("JWT_AUDIENCE").unwrap_or_else(|_| "esotheric-mobile".to_string());

    let jwt_service = JwtService::new(&jwt_private_key, jwt_issuer, jwt_audience)
        .expect("Failed to initialize JWT service");

    let auth_state = Arc::new(AuthState::new(jwt_service, cache));

    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/esotheric".to_string());

    let manager = ConnectionManager::<PgConnection>::new(&database_url);
    let db_pool = r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create database pool");

    let user_state = user_handlers::UserState::new(db_pool.clone());
    let provider_state = provider_handlers::ProviderState::new(db_pool.clone());
    let service_state = service_handlers::ServiceState::new(db_pool.clone());

    // Auth routes
    let auth_router = Router::new()
        .route("/oauth/authorize", get(auth_handlers::authorize))
        .route("/oauth/token", post(auth_handlers::token))
        .route("/oauth/revoke", post(auth_handlers::revoke))
        .route("/.well-known/jwks.json", get(auth_handlers::jwks))
        .with_state(auth_state);

    // User routes
    let user_router = Router::new()
        .route("/api/v1/users/register", post(user_handlers::register))
        .route("/api/v1/users/login", post(user_handlers::login))
        .route("/api/v1/users/:user_id", get(user_handlers::get_profile))
        .route("/api/v1/users/:user_id", put(user_handlers::update_profile))
        .route(
            "/api/v1/users/:user_id/password",
            put(user_handlers::change_password),
        )
        .with_state(user_state.clone());

    // Provider routes
    let provider_router = Router::new()
        .route("/api/v1/providers", get(provider_handlers::list_providers))
        .route(
            "/api/v1/providers",
            post(provider_handlers::create_provider),
        )
        .route(
            "/api/v1/providers/:provider_id",
            get(provider_handlers::get_provider),
        )
        .route(
            "/api/v1/providers/user/:user_id",
            get(provider_handlers::get_provider_by_user),
        )
        .route(
            "/api/v1/providers/:provider_id",
            put(provider_handlers::update_provider),
        )
        .route(
            "/api/v1/providers/:provider_id/verify",
            post(provider_handlers::verify_provider),
        )
        .route(
            "/api/v1/providers/:provider_id/deactivate",
            post(provider_handlers::deactivate_provider),
        )
        .with_state(provider_state.clone());

    // Service routes
    let service_router = Router::new()
        .route("/api/v1/services", get(service_handlers::list_services))
        .route(
            "/api/v1/services/search",
            get(service_handlers::search_services),
        )
        .route("/api/v1/services", post(service_handlers::create_service))
        .route(
            "/api/v1/services/:service_id",
            get(service_handlers::get_service),
        )
        .route(
            "/api/v1/services/:service_id",
            put(service_handlers::update_service),
        )
        .route(
            "/api/v1/services/:service_id",
            delete(service_handlers::delete_service),
        )
        .route(
            "/api/v1/services/:service_id/publish",
            post(service_handlers::publish_service),
        )
        .route(
            "/api/v1/services/:service_id/unpublish",
            post(service_handlers::unpublish_service),
        )
        .route(
            "/api/v1/providers/:provider_id/services",
            get(service_handlers::get_provider_services),
        )
        .with_state(service_state.clone());

    // Merge all routers
    let app = Router::new()
        .route("/", get(|| async { "Hello, Esotheric!" }))
        .merge(auth_router)
        .merge(user_router)
        .merge(provider_router)
        .merge(service_router);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    println!("Server running on http://0.0.0.0:3000");
    println!("User endpoints:");
    println!("  - Register: POST /api/v1/users/register");
    println!("  - Login: POST /api/v1/users/login");
    println!("  - Get Profile: GET /api/v1/users/:user_id");
    println!("  - Update Profile: PUT /api/v1/users/:user_id");
    println!("  - Change Password: PUT /api/v1/users/:user_id/password");
    println!("Provider endpoints:");
    println!("  - List Providers: GET /api/v1/providers");
    println!("  - Create Provider: POST /api/v1/providers");
    println!("  - Get Provider: GET /api/v1/providers/:provider_id");
    println!("  - Get Provider by User: GET /api/v1/providers/user/:user_id");
    println!("  - Update Provider: PUT /api/v1/providers/:provider_id");
    println!("  - Verify Provider: POST /api/v1/providers/:provider_id/verify");
    println!("  - Deactivate Provider: POST /api/v1/providers/:provider_id/deactivate");
    println!("Service endpoints:");
    println!("  - List Services: GET /api/v1/services");
    println!("  - Search Services: GET /api/v1/services/search");
    println!("  - Create Service: POST /api/v1/services");
    println!("  - Get Service: GET /api/v1/services/:service_id");
    println!("  - Update Service: PUT /api/v1/services/:service_id");
    println!("  - Delete Service: DELETE /api/v1/services/:service_id");
    println!("  - Publish Service: POST /api/v1/services/:service_id/publish");
    println!("  - Unpublish Service: POST /api/v1/services/:service_id/unpublish");
    println!("  - Get Provider Services: GET /api/v1/providers/:provider_id/services");
    println!("OAuth2 endpoints:");
    println!("  - Authorization: GET /oauth/authorize");
    println!("  - Token: POST /oauth/token");
    println!("  - Revoke: POST /oauth/revoke");
    println!("  - JWKS: GET /.well-known/jwks.json");

    axum::serve(listener, app).await.unwrap();
}

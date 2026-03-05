use auth::{handlers as auth_handlers, AuthState, JwtService};
use axum::{
    routing::{delete, get, post, put},
    Router,
};
use bookings::handlers as booking_handlers;
use common::{
    cache::{ValkeyCache, ValkeyConfig},
    init_logging,
};
use diesel::r2d2::ConnectionManager;
use diesel::PgConnection;
use notifications::handlers as notification_handlers;
use notifications::fcm::FcmConfig;
use payments::handlers as payment_handlers;
use payments::providers::{
    mock::MockPaymentProvider, stripe::StripeProvider, PaymentProvider, PaymentProviderType,
};
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
    let booking_state = booking_handlers::BookingState::new(db_pool.clone());

    let payment_provider: Arc<dyn PaymentProvider> =
        if let Ok(stripe_key) = env::var("STRIPE_API_KEY") {
            if !stripe_key.is_empty() && stripe_key != "sk_test_placeholder" {
                Arc::new(StripeProvider::new(stripe_key).expect("Failed to create Stripe provider"))
            } else {
                Arc::new(MockPaymentProvider::new(PaymentProviderType::Stripe))
            }
        } else {
            Arc::new(MockPaymentProvider::new(PaymentProviderType::Stripe))
        };

    let payment_state = Arc::new(payment_handlers::PaymentState::new(
        db_pool.clone(),
        payment_provider,
    ));

    let notification_state = if let Ok(fcm_key) = env::var("FCM_SERVER_KEY") {
        if !fcm_key.is_empty() {
            let fcm_config = FcmConfig {
                server_key: fcm_key,
            };
            notification_handlers::NotificationState::with_fcm(db_pool.clone(), fcm_config)
        } else {
            notification_handlers::NotificationState::new(db_pool.clone())
        }
    } else {
        notification_handlers::NotificationState::new(db_pool.clone())
    };

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

    // Booking routes
    let booking_router = Router::new()
        .route("/api/v1/bookings", post(booking_handlers::create_booking))
        .route("/api/v1/bookings", get(booking_handlers::list_bookings))
        .route(
            "/api/v1/bookings/:booking_id",
            get(booking_handlers::get_booking),
        )
        .route(
            "/api/v1/bookings/:booking_id/confirm",
            post(booking_handlers::confirm_booking),
        )
        .route(
            "/api/v1/bookings/:booking_id/start",
            post(booking_handlers::start_booking),
        )
        .route(
            "/api/v1/bookings/:booking_id/complete",
            post(booking_handlers::complete_booking),
        )
        .route(
            "/api/v1/bookings/:booking_id/cancel",
            post(booking_handlers::cancel_booking),
        )
        .route(
            "/api/v1/customers/:customer_id/bookings",
            get(booking_handlers::get_customer_bookings),
        )
        .route(
            "/api/v1/providers/:provider_id/bookings",
            get(booking_handlers::get_provider_bookings),
        )
        .route(
            "/api/v1/services/:service_id/bookings",
            get(booking_handlers::get_service_bookings),
        )
        .route(
            "/api/v1/providers/:provider_id/availability",
            get(booking_handlers::check_availability),
        )
        .with_state(booking_state.clone());

    // Payment routes
    let payment_router = Router::new()
        .route(
            "/api/v1/payments",
            post(payment_handlers::create_payment_intent),
        )
        .route(
            "/api/v1/payments/webhook",
            post(payment_handlers::handle_webhook),
        )
        .route(
            "/api/v1/payments/:payment_id",
            get(payment_handlers::get_payment),
        )
        .route(
            "/api/v1/payments/booking/:booking_id",
            get(payment_handlers::get_payment_by_booking),
        )
        .route(
            "/api/v1/payments/:payment_id/refund",
            post(payment_handlers::refund_payment),
        )
        .route(
            "/api/v1/customers/:customer_id/payments",
            get(payment_handlers::get_customer_payments),
        )
        .route(
            "/api/v1/providers/:provider_id/payments",
            get(payment_handlers::get_provider_payments),
        )
        .with_state(payment_state.clone());

    // Notification routes
    let notification_router = notification_handlers::router()
        .with_state(Arc::new(notification_state));

    // Merge all routers
    let app = Router::new()
        .route("/", get(|| async { "Hello, Esotheric!" }))
        .merge(auth_router)
        .merge(user_router)
        .merge(provider_router)
        .merge(service_router)
        .merge(booking_router)
        .merge(payment_router)
        .merge(notification_router);

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
    println!("Booking endpoints:");
    println!("  - Create Booking: POST /api/v1/bookings");
    println!("  - List Bookings: GET /api/v1/bookings");
    println!("  - Get Booking: GET /api/v1/bookings/:booking_id");
    println!("  - Confirm Booking: POST /api/v1/bookings/:booking_id/confirm");
    println!("  - Start Booking: POST /api/v1/bookings/:booking_id/start");
    println!("  - Complete Booking: POST /api/v1/bookings/:booking_id/complete");
    println!("  - Cancel Booking: POST /api/v1/bookings/:booking_id/cancel");
    println!("  - Get Customer Bookings: GET /api/v1/customers/:customer_id/bookings");
    println!("  - Get Provider Bookings: GET /api/v1/providers/:provider_id/bookings");
    println!("  - Get Service Bookings: GET /api/v1/services/:service_id/bookings");
    println!("  - Check Availability: GET /api/v1/providers/:provider_id/availability");
    println!("Payment endpoints:");
    println!("  - Create Payment Intent: POST /api/v1/payments");
    println!("  - Webhook Handler: POST /api/v1/payments/webhook");
    println!("  - Get Payment: GET /api/v1/payments/:payment_id");
    println!("  - Get Payment by Booking: GET /api/v1/payments/booking/:booking_id");
    println!("  - Refund Payment: POST /api/v1/payments/:payment_id/refund");
    println!("  - Get Customer Payments: GET /api/v1/customers/:customer_id/payments");
    println!("  - Get Provider Payments: GET /api/v1/providers/:provider_id/payments");
    println!("Notification endpoints:");
    println!("  - Register Push Token: POST /api/v1/users/:user_id/push-tokens");
    println!("  - Unregister Push Token: DELETE /api/v1/users/:user_id/push-tokens/:token");
    println!("  - Get Push Tokens: GET /api/v1/users/:user_id/push-tokens");
    println!("  - Create Support Ticket: POST /api/v1/support/tickets");
    println!("  - Get Support Ticket: GET /api/v1/support/tickets/:ticket_id");
    println!("  - Add Support Message: POST /api/v1/support/tickets/:ticket_id/messages");
    println!("  - Get Support Messages: GET /api/v1/support/tickets/:ticket_id/messages");

    axum::serve(listener, app).await.unwrap();
}

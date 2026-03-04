use axum::{routing::get, Router};
use common::init_logging;

#[tokio::main]
async fn main() {
    init_logging();

    let app = Router::new().route("/", get(|| async { "Hello, Esotheric!" }));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    println!("Server running on http://0.0.0.0:3000");

    axum::serve(listener, app).await.unwrap();
}
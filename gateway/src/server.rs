use crate::config::Config;
use crate::db::Database;
use crate::handlers::{self};
use axum::{
    Router,
    body::Body,
    extract::{Path, Query, State},
    http::{HeaderMap, HeaderName, HeaderValue, StatusCode, Uri},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
};
use std::fs;
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::{services::ServeDir, trace::TraceLayer};
use tracing::info;

pub async fn start(config: Config) -> anyhow::Result<()> {
    let shared_config = Arc::new(config.clone());

    // Initialize database
    let database = Arc::new(Database::new(&config.database.url).await?);
    println!("Database initialized at: {}", config.database.url);

    let app = Router::new()
        .route(
            "/v1/messages",
            post(handlers::create_anthropic_chat_completion),
        )
        .route("/health", get(handlers::health_check))
        .route("/api/sessions", get(handlers::get_sessions))
        .route("/api/sessions/{id}", get(handlers::get_session))
        .nest_service("/assets", ServeDir::new("web/dist/assets"))
        .route(
            "/vite.svg",
            get(|| async {
                match fs::read("web/dist/vite.svg") {
                    Ok(content) => (StatusCode::OK, content).into_response(),
                    Err(_) => (StatusCode::NOT_FOUND, "Not Found").into_response(),
                }
            }),
        )
        .fallback(handlers::spa_fallback)
        .layer(TraceLayer::new_for_http())
        .with_state((shared_config, database));

    let address = format!("{}:{}", config.server.host, config.server.port);
    let listener = TcpListener::bind(&address).await?;

    info!("Server starting on http://{}", address);
    axum::serve(listener, app).await?;
    Ok(())
}

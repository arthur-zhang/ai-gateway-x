use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;

mod config;
mod db;
mod errors;
mod handlers;
mod server;
mod thread;
mod utils;

async fn init_tracing(config: &Config) -> Result<(), Box<dyn std::error::Error>> {
    // Try to load config for logging settings, fall back to defaults

    // Parse log level
    let log_level = match config.logging.level.to_lowercase().as_str() {
        "trace" => tracing::Level::TRACE,
        "debug" => tracing::Level::DEBUG,
        "info" => tracing::Level::INFO,
        "warn" => tracing::Level::WARN,
        "error" => tracing::Level::ERROR,
        _ => {
            eprintln!(
                "Invalid log level '{}', defaulting to 'info'",
                config.logging.level
            );
            tracing::Level::INFO
        }
    };

    // Configure tracing based on format preference
    match config.logging.format.to_lowercase().as_str() {
        "json" => {
            // Structured JSON logging for production
            tracing_subscriber::registry()
                .with(
                    tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                        format!(
                            "gateway={},tower_http=debug,axum::rejection=trace",
                            log_level
                        )
                        .into()
                    }),
                )
                .with(
                    tracing_subscriber::fmt::layer()
                        .json()
                        .with_current_span(false)
                        .with_span_list(true)
                        .with_target(true)
                        .with_thread_ids(true)
                        .with_thread_names(true),
                )
                .init();
        }
        _ => {
            // Human-readable logging for development
            tracing_subscriber::registry()
                .with(
                    tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                        format!(
                            "gateway={},tower_http=debug,axum::rejection=trace",
                            log_level
                        )
                        .into()
                    }),
                )
                .with(
                    tracing_subscriber::fmt::layer()
                        .with_target(true)
                        .with_thread_ids(false)
                        .with_thread_names(false)
                        .compact(),
                )
                .init();
        }
    }

    Ok(())
}

#[tokio::main]
async fn main() {
    let config = match Config::load("config.toml").await {
        Ok(config) => config,
        Err(e) => {
            eprintln!("Failed to load config: {:?}", e);
            std::process::exit(1);
        }
    };

    if let Err(e) = init_tracing(&config).await {
        eprintln!("Failed to initialize tracing: {}", e);
        std::process::exit(1);
    }
    info!("AI Gateway starting up...");

    match server::start(config).await {
        Ok(_) => {
            info!("Server shutdown gracefully");
        }
        Err(err) => {
            println!("{}", err);
        }
    }
}

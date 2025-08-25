use anthropic::AnthropicError;
use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    #[error("Invalid data: {0}")]
    InvalidData(String),
    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
    #[error("Configuration error: {0}")]
    ConfigError(String),
    #[error("Provider error: {0}")]
    ProviderError(String),
    #[error("Validation error: {0}")]
    ValidationError(String),
    #[error("Resource not found: {0}")]
    NotFound(String),
    #[error("Anthropic API error: {0:?}")]
    ProviderErrorAnthropic(#[from] AnthropicError),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match &self {
            AppError::DatabaseError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
            AppError::SerializationError(_) => (StatusCode::BAD_REQUEST, "Invalid data format"),
            AppError::ConfigError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Configuration error"),
            AppError::ProviderError(_) => (StatusCode::BAD_GATEWAY, "Provider error"),
            AppError::ValidationError(_) => (StatusCode::BAD_REQUEST, "Validation error"),
            AppError::NotFound(_) => (StatusCode::NOT_FOUND, "Resource not found"),
            AppError::ProviderErrorAnthropic(_) => (StatusCode::BAD_GATEWAY, "anthropic error"),
            AppError::InvalidData(_) => (StatusCode::BAD_REQUEST, "Invalid data provided"),
        };

        let body = Json(json!({
            "error": error_message,
            "details": self.to_string()
        }));

        (status, body).into_response()
    }
}

pub type AppResult<T> = Result<T, AppError>;

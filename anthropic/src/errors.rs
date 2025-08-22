use std::convert::Into;
use std::str::FromStr;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use strum::EnumString;
use thiserror::Error;
use llm_common::{LanguageModelCompletionError, LanguageModelProviderName};

pub type AnthropicResult<T> = Result<T, AnthropicError>;

#[derive(Debug)]
#[derive(thiserror::Error)]
pub enum AnthropicError {
    /// Failed to serialize the HTTP request body to JSON
    #[error("Failed to serialize the HTTP request body to JSON: {0}")]
    SerializeRequest(#[from] serde_json::Error),

    /// Failed to construct the HTTP request body
    #[error("Failed to construct the HTTP request body: {0}")]
    BuildRequestBody(#[from] http::Error),

    /// Failed to send the HTTP request
    #[error("Failed to send the HTTP request: {0}")]
    HttpSend(#[from] anyhow::Error),

    /// Failed to deserialize the response from JSON
    #[error("Failed to deserialize the response from JSON: {0}")]
    DeserializeResponse(serde_json::Error),

    /// Failed to read from response stream
    #[error("Failed to read from response stream: {0}")]
    ReadResponse(#[from] std::io::Error),

    /// HTTP error response from the API
    #[error("HTTP error response from the API: {status_code}: {message}")]
    HttpResponseError {
        status_code: http::StatusCode,
        message: String,
    },

    /// Rate limit exceeded
    #[error("Rate limit exceeded: {retry_after:?}")]
    RateLimit { retry_after: Duration },

    /// Server overloaded
    #[error("Server overloaded: {retry_after:?}")]
    ServerOverloaded { retry_after: Option<Duration> },

    /// API returned an error response
    #[error("Anthropic API Error: {0:?}")]
    ApiError(#[from] ApiError),
}

#[derive(Debug, Serialize, Deserialize, Error)]
#[error("Anthropic API Error: {error_type}: {message}")]
pub struct ApiError {
    #[serde(rename = "type")]
    pub error_type: String,
    pub message: String,
}
impl ApiError {
    pub fn code(&self) -> Option<ApiErrorCode> {
        ApiErrorCode::from_str(&self.error_type).ok()
    }

    pub fn is_rate_limit_error(&self) -> bool {
        matches!(self.error_type.as_str(), "rate_limit_error")
    }

    pub fn match_window_exceeded(&self) -> Option<u64> {
        let Some(ApiErrorCode::InvalidRequestError) = self.code() else {
            return None;
        };

        parse_prompt_too_long(&self.message)
    }
}
pub fn parse_prompt_too_long(message: &str) -> Option<u64> {
    message
        .strip_prefix("prompt is too long: ")?
        .split_once(" tokens")?
        .0
        .parse()
        .ok()
}

impl Into<LanguageModelCompletionError> for AnthropicError{
    fn into(self) -> LanguageModelCompletionError {
        let ANTHROPIC_PROVIDER_NAME: LanguageModelProviderName = LanguageModelProviderName("anthropic".into());

        let provider = ANTHROPIC_PROVIDER_NAME;
        match self {
            AnthropicError::SerializeRequest(error) => LanguageModelCompletionError::SerializeRequest { provider, error },
            AnthropicError::BuildRequestBody(error) => LanguageModelCompletionError::BuildRequestBody { provider, error },
            AnthropicError::HttpSend(error) => LanguageModelCompletionError::HttpSend { provider, error },
            AnthropicError::DeserializeResponse(error) => {
                LanguageModelCompletionError::DeserializeResponse { provider, error }
            }
            AnthropicError::ReadResponse(error) => LanguageModelCompletionError::ApiReadResponseError { provider, error },
            AnthropicError::HttpResponseError {
                status_code,
                message,
            } => LanguageModelCompletionError::HttpResponseError {
                provider,
                status_code,
                message,
            },
            AnthropicError::RateLimit { retry_after } => LanguageModelCompletionError::RateLimitExceeded {
                provider,
                retry_after: Some(retry_after),
            },
            AnthropicError::ServerOverloaded { retry_after } => LanguageModelCompletionError::ServerOverloaded {
                provider,
                retry_after: retry_after,
            },
            AnthropicError::ApiError(api_error) => api_error.into(),
        }
    }
}


/// An Anthropic API error code.
/// <https://docs.anthropic.com/en/api/errors#http-errors>
#[derive(Debug, PartialEq, Eq, Clone, Copy, EnumString)]
#[strum(serialize_all = "snake_case")]
pub enum ApiErrorCode {
    /// 400 - `invalid_request_error`: There was an issue with the format or content of your request.
    InvalidRequestError,
    /// 401 - `authentication_error`: There's an issue with your API key.
    AuthenticationError,
    /// 403 - `permission_error`: Your API key does not have permission to use the specified resource.
    PermissionError,
    /// 404 - `not_found_error`: The requested resource was not found.
    NotFoundError,
    /// 413 - `request_too_large`: Request exceeds the maximum allowed number of bytes.
    RequestTooLarge,
    /// 429 - `rate_limit_error`: Your account has hit a rate limit.
    RateLimitError,
    /// 500 - `api_error`: An unexpected error has occurred internal to Anthropic's systems.
    ApiError,
    /// 529 - `overloaded_error`: Anthropic's API is temporarily overloaded.
    OverloadedError,
}

impl Into<LanguageModelCompletionError> for ApiError{
    fn into(self) -> LanguageModelCompletionError {
        use ApiErrorCode::*;
        let ANTHROPIC_PROVIDER_NAME: LanguageModelProviderName = LanguageModelProviderName("anthropic".into());

        let provider = ANTHROPIC_PROVIDER_NAME;
        match self.code() {
            Some(code) => match code {
                InvalidRequestError => LanguageModelCompletionError::BadRequestFormat {
                    provider,
                    message: self.message,
                },
                AuthenticationError => LanguageModelCompletionError::AuthenticationError {
                    provider,
                    message: self.message,
                },
                PermissionError => LanguageModelCompletionError::PermissionError {
                    provider,
                    message: self.message,
                },
                NotFoundError => LanguageModelCompletionError::ApiEndpointNotFound { provider },
                RequestTooLarge => LanguageModelCompletionError::PromptTooLarge {
                    tokens: parse_prompt_too_long(&self.message),
                },
                RateLimitError => LanguageModelCompletionError::RateLimitExceeded {
                    provider,
                    retry_after: None,
                },
                ApiError => LanguageModelCompletionError::ApiInternalServerError {
                    provider,
                    message: self.message,
                },
                OverloadedError => LanguageModelCompletionError::ServerOverloaded {
                    provider,
                    retry_after: None,
                },
            },
            None => LanguageModelCompletionError::Other(self.into()),
        }
    }
}

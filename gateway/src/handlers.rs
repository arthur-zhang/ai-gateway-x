use crate::{config::Config, db::Database, errors::AppResult, thread::Session};
use anthropic::{AnthropicProvider, RespEvent, StreamingResponseBuilder};
use axum::{
    Json,
    body::Body,
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::{Html, IntoResponse, Response},
};
use either::Either;
use futures::StreamExt;
use http::Uri;
use llm_common::StopReason;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::error;

#[derive(Deserialize)]
pub struct SessionsQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

#[derive(Serialize)]
pub struct SessionsResponse {
    pub sessions: Vec<crate::db::SessionRecord>,
    pub total: i64,
    pub page: i64,
    pub limit: i64,
    pub total_pages: i64,
}

pub async fn get_sessions(
    Query(query): Query<SessionsQuery>,
    State((_, db)): State<(Arc<Config>, Arc<Database>)>,
) -> impl IntoResponse {
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(20).min(100).max(1); // 默认20，最大100，最小1
    let offset = (page - 1) * limit;

    let sessions_result = db.get_sessions(Some(limit), Some(offset)).await;
    let total_result = db.get_sessions_count().await;

    match (sessions_result, total_result) {
        (Ok(sessions), Ok(total)) => {
            let total_pages = (total + limit - 1) / limit; // 向上取整
            let response = SessionsResponse {
                sessions,
                total,
                page,
                limit,
                total_pages,
            };
            (StatusCode::OK, Json(response)).into_response()
        }
        (Err(e), _) | (_, Err(e)) => {
            eprintln!("Failed to get sessions: {:?}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Failed to retrieve sessions"})),
            )
                .into_response()
        }
    }
}

pub async fn get_session(
    State((_, db)): State<(Arc<Config>, Arc<Database>)>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match db.get_session(&id).await {
        Ok(Some(session)) => (StatusCode::OK, Json(session)).into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Session not found"})),
        )
            .into_response(),
        Err(e) => {
            eprintln!("Failed to get session {}: {:?}", id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "Failed to retrieve session"})),
            )
                .into_response()
        }
    }
}

pub async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "OK").into_response()
}

pub async fn spa_fallback(uri: Uri) -> impl IntoResponse {
    let path = uri.path();

    // If it's an API route, let it fall through to 404
    if path.starts_with("/api") || path.starts_with("/v1") {
        return (StatusCode::NOT_FOUND, "Not Found").into_response();
    }

    // Try to serve static files first
    if let Ok(content) = tokio::fs::read_to_string("web/dist/index.html").await {
        return Html(content).into_response();
    }

    (
        StatusCode::INTERNAL_SERVER_ERROR,
        "Failed to load index.html",
    )
        .into_response()
}

pub async fn create_anthropic_chat_completion(
    State((config, db)): State<(Arc<Config>, Arc<Database>)>,
    headers: HeaderMap,
    body: String,
) -> AppResult<impl IntoResponse> {
    #[derive(Deserialize)]
    struct StreamingCheck {
        #[serde(default)]
        stream: bool,
    }

    let is_streaming = serde_json::from_str::<StreamingCheck>(&body)?.stream;

    let (streaming_tx, mut streaming_rx) = mpsc::channel(100);
    tokio::spawn({
        let db = db.clone();
        let session = Session::new(&body, headers.clone());
        async move {
            let mut session = match session {
                Ok(session) => session,
                Err(e) => {
                    error!("Failed to create session: {:?}", e);
                    return;
                }
            };
            if let Err(e) = db.new_session(&session).await {
                error!("Failed to create session in database: {:?}", e);
            }
            let mut response_builder = StreamingResponseBuilder::new();

            while let Some(resp_event_result) = streaming_rx.recv().await {
                match resp_event_result {
                    Ok(RespEvent::RespHeaders(headers, status_code)) => {
                        session.http_resp_headers = Some(headers);
                        session.http_status_code = Some(status_code);
                    }
                    Ok(RespEvent::Streaming(event)) => {
                        response_builder.process_event(event);
                    }
                    Ok(RespEvent::NonStreaming(resp)) => {
                        response_builder.set_resp(resp);
                    }
                    Err(e) => {
                        error!("Error in streaming event: {:?}", e);
                        break;
                    }
                }
            }

            // Build the complete response from streaming events
            let complete_response = response_builder.finalize();

            if let Some(stop_reason) = &complete_response.stop_reason {
                session.stop_reason = match stop_reason.as_str() {
                    "end_turn" => StopReason::EndTurn,
                    "max_tokens" => StopReason::MaxTokens,
                    "tool_use" => StopReason::ToolUse,
                    "refusal" => StopReason::Refusal,
                    _ => StopReason::EndTurn,
                };
            }
            session.token_usage = complete_response.usage.clone();
            let id = session.id.clone();
            session.request_id = complete_response.id.clone();
            session.response = serde_json::to_string(&complete_response).ok();
            // Save completed session to database
            if let Err(e) = db.update_session(&id, &session).await {
                error!("Failed to save session to database: {:?}", e);
            } else {
                println!("Session {} saved to database", session.id);
            }
        }
    });

    let provider = AnthropicProvider::new(&config.providers.anthropic.base_url);

    let response = provider
        .execute(headers, body, is_streaming, streaming_tx)
        .await?;

    let (parts, response_data) = response.into_parts();
    let mut backend_headers = parts.headers;
    backend_headers.remove("content-length");

    match response_data {
        Either::Left(stream) => {
            let stream = stream.map(move |line_result| match line_result {
                Ok(line) => Ok(format!("{}\n", line)),
                Err(_) => Err("Stream error".to_string()),
            });

            let body = Body::from_stream(stream);

            Ok((backend_headers, body).into_response())
        }
        Either::Right(resp) => Ok((backend_headers, resp).into_response()),
    }
}

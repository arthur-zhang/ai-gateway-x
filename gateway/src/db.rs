use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Row, sqlite::SqlitePool};

use crate::thread::Session;

#[derive(Debug, Clone)]
pub struct Database {
    pub pool: SqlitePool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionRecord {
    pub id: String,                 // UUID for internal use
    pub request_id: Option<String>, // Human-readable request ID for UI display
    pub model: String,
    pub is_streaming: bool,
    pub token_usage_input: i64,
    pub token_usage_output: i64,
    pub stop_reason: String,
    pub request_json: String,
    pub response: Option<String>, // Unified response field for both streaming and non-streaming
    pub http_req_headers: Option<String>, // JSON object of request headers
    pub http_resp_headers: Option<String>, // JSON object of response headers
    pub http_status_code: Option<u16>,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub status: String,
}

impl Database {
    pub async fn new(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = SqlitePool::connect(database_url).await?;

        Ok(Self { pool })
    }

    pub async fn update_session(&self, id: &str, session: &Session) -> Result<(), sqlx::Error> {
        let model = &session.model;
        let is_streaming = session.is_streaming;
        let input_tokens = session.token_usage.input_tokens.unwrap_or(0) as i64;
        let output_tokens = session.token_usage.output_tokens.unwrap_or(0) as i64;
        let stop_reason = format!("{:?}", session.stop_reason);
        let completed_at = Utc::now().timestamp_millis();
        let response = session.response.clone();
        let http_status_code = session.http_status_code.map(|sc| sc.as_u16() as i64);

        let req_headers = session.get_req_header_as_string();
        let resp_headers = session.get_resp_header_as_string();
        // Update existing session
        sqlx::query!(
            r#"
            UPDATE sessions 
            SET  request_id = ?, model = ?, is_streaming = ?, token_usage_input = ?, token_usage_output = ?, 
                stop_reason = ?, response = ?, http_req_headers = ?, http_resp_headers = ?,
                http_status_code = ?, completed_at = ?, status = ?
            WHERE id = ?
            "#,
            session.request_id,
            model,
            is_streaming,
            input_tokens,
            output_tokens,
            stop_reason,
            response,
            req_headers,
            resp_headers,
            http_status_code,
            completed_at,
            "completed",
            id,
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn new_session(&self, session: &Session) -> Result<(), sqlx::Error> {
        let model = &session.model;
        let is_streaming = session.is_streaming;
        let input_tokens = session.token_usage.input_tokens.unwrap_or(0) as i64;
        let output_tokens = session.token_usage.output_tokens.unwrap_or(0) as i64;
        let stop_reason = format!("{:?}", session.stop_reason);
        let request_json = session.raw_request_json.clone();
        let created_at = Utc::now().timestamp_millis();
        let http_status_code = session.http_status_code.map(|sc| sc.as_u16() as i64);
        let req_headers = session.get_req_header_as_string();
        let resp_headers = session.get_resp_header_as_string();
        // Insert new session with pending status
        sqlx::query!(
            r#"
            INSERT INTO sessions 
            (id, model, is_streaming, token_usage_input, token_usage_output, stop_reason,
             request_json, http_req_headers, http_resp_headers, http_status_code, status, created_at)
            VALUES (?,  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            session.id,
            model,
            is_streaming,
            input_tokens,
            output_tokens,
            stop_reason,
            request_json,
            req_headers,
            resp_headers,
            http_status_code,
            "pending",
            created_at
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_session(
        &self,
        session_id: &str,
    ) -> Result<Option<SessionRecord>, sqlx::Error> {
        let row = sqlx::query("SELECT * FROM sessions WHERE id = ?")
            .bind(session_id)
            .fetch_optional(&self.pool)
            .await?;

        let Some(row) = row else {
            return Ok(None);
        };

        Ok(Some(SessionRecord {
            id: row.try_get("id").unwrap_or_default(),
            request_id: row.try_get("request_id").ok(),
            model: row.try_get("model").unwrap_or_default(),
            is_streaming: row.try_get::<i64, _>("is_streaming").unwrap_or(0) != 0,
            token_usage_input: row.try_get("token_usage_input").unwrap_or(0),
            token_usage_output: row.try_get("token_usage_output").unwrap_or(0),
            stop_reason: row.try_get("stop_reason").unwrap_or_default(),
            request_json: row.try_get("request_json").unwrap_or_default(),
            response: row.try_get("response").ok(),
            http_req_headers: row.try_get("http_req_headers").ok(),
            http_resp_headers: row.try_get("http_resp_headers").ok(),
            http_status_code: row
                .try_get::<i64, _>("http_status_code")
                .ok()
                .map(|v| v as u16),
            created_at: row
                .try_get::<i64, _>("created_at")
                .ok()
                .map(|ts| {
                    DateTime::from_timestamp_millis(ts)
                        .unwrap_or_default()
                        .with_timezone(&Utc)
                })
                .unwrap_or_else(|| Utc::now()),
            completed_at: row.try_get::<i64, _>("completed_at").ok().map(|ts| {
                DateTime::from_timestamp_millis(ts)
                    .unwrap_or_default()
                    .with_timezone(&Utc)
            }),
            status: row.try_get("status").unwrap_or("pending".to_string()),
        }))
    }

    pub async fn get_sessions(
        &self,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<Vec<SessionRecord>, sqlx::Error> {
        let limit = limit.unwrap_or(100);
        let offset = offset.unwrap_or(0);

        let rows = sqlx::query("SELECT * FROM sessions ORDER BY created_at DESC LIMIT ? OFFSET ?")
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await?;

        let sessions = rows
            .into_iter()
            .map(|row| SessionRecord {
                id: row.try_get("id").unwrap_or_default(),
                request_id: row.try_get("request_id").ok(),
                model: row.try_get("model").unwrap_or_default(),
                is_streaming: row.try_get::<i64, _>("is_streaming").unwrap_or(0) != 0,
                token_usage_input: row.try_get("token_usage_input").unwrap_or(0),
                token_usage_output: row.try_get("token_usage_output").unwrap_or(0),
                stop_reason: row.try_get("stop_reason").unwrap_or_default(),
                request_json: row.try_get("request_json").unwrap_or_default(),
                response: row.try_get("response").ok(),
                http_req_headers: row.try_get("http_req_headers").ok(),
                http_resp_headers: row.try_get("http_resp_headers").ok(),
                http_status_code: row
                    .try_get::<i64, _>("http_status_code")
                    .ok()
                    .map(|v| v as u16),
                created_at: row
                    .try_get::<i64, _>("created_at")
                    .ok()
                    .map(|ts| {
                        DateTime::from_timestamp_millis(ts)
                            .unwrap_or_default()
                            .with_timezone(&Utc)
                    })
                    .unwrap_or_else(|| Utc::now()),
                completed_at: row.try_get::<i64, _>("completed_at").ok().map(|ts| {
                    DateTime::from_timestamp_millis(ts)
                        .unwrap_or_default()
                        .with_timezone(&Utc)
                }),
                status: row.try_get("status").unwrap_or("pending".to_string()),
            })
            .collect();

        Ok(sessions)
    }

    pub async fn get_sessions_count(&self) -> Result<i64, sqlx::Error> {
        let row = sqlx::query("SELECT COUNT(*) as count FROM sessions")
            .fetch_one(&self.pool)
            .await?;

        Ok(row.try_get("count").unwrap_or(0))
    }
}

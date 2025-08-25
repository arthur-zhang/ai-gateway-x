use crate::utils::HeaderMapExt;
use anthropic::Usage;
use http::HeaderMap;
use llm_common::StopReason;
use uuid::Uuid;

#[derive(Debug)]
pub struct Session {
    pub id: String,         // UUID for internal use
    pub request_id: String, // Human-readable request ID
    pub raw_request_json: String,
    pub model: String,
    pub is_streaming: bool,
    pub token_usage: Usage,
    pub stop_reason: StopReason,
    pub response: Option<String>,
    pub http_req_headers: Option<HeaderMap>, // JSON string of request headers
    pub http_resp_headers: Option<HeaderMap>, // JSON string of response headers
    pub http_status_code: Option<http::StatusCode>,
}
impl Session {
    pub fn new(raw_request_json: &str, req_headers: HeaderMap) -> anyhow::Result<Self> {
        let uuid = Uuid::new_v4();
        let request_id = format!("req_{}", &uuid.to_string()[0..8]); // Create readable request ID

        let parsed_req = serde_json::from_str::<anthropic::Request>(&raw_request_json)?;
        Ok(Self {
            id: uuid.to_string(),
            request_id,
            raw_request_json: raw_request_json.to_string(),
            model: parsed_req.model,
            is_streaming: parsed_req.stream.unwrap_or_default(),
            token_usage: Usage::default(),
            stop_reason: StopReason::EndTurn,
            response: None,
            http_req_headers: Some(req_headers),
            http_resp_headers: None,
            http_status_code: None,
        })
    }

    pub fn get_req_header_as_string(&self) -> String {
        let headers = self.http_req_headers.as_ref().map(|it| it.to_string_map());
        serde_json::to_string(&headers.unwrap_or_default()).unwrap_or_default()
    }

    pub fn get_resp_header_as_string(&self) -> String {
        let headers = self.http_resp_headers.as_ref().map(|it| it.to_string_map());
        serde_json::to_string(&headers.unwrap_or_default()).unwrap_or_default()
    }
}

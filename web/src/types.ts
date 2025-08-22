// Legacy types (kept for compatibility)
export interface RequestSummary {
  id: string;
  timestamp: number;
  model: string;
  status_code: number;
  is_streaming: boolean;
  duration_ms?: number;
}

export interface RequestLog {
  id: string;
  timestamp: number;
  model: string;
  status_code: number;
  is_streaming: boolean;
  request_body: any;
  response_body?: any;
  error_message?: string;
  duration_ms?: number;
}

// New session types from database
export interface SessionRecord {
  id: string; // UUID for internal use
  request_id?: string; // Human-readable request ID for UI display
  model: string;
  is_streaming: boolean;
  token_usage_input: number;
  token_usage_output: number;
  stop_reason: string;
  request_json: string;
  response?: string; // Unified response field for both streaming and non-streaming
  tool_use_json?: string; // JSON for tool usage
  http_req_headers?: string; // JSON object of request headers
  http_resp_headers?: string; // JSON object of response headers
  http_status_code?: number; // HTTP status code
  created_at: string; // ISO string
  completed_at?: string; // ISO string
  status: string; // pending, completed, error
}

export interface MessageSegment {
  segment_type: string;
  text_content?: string;
  thinking_signature?: string;
}

export interface Message {
  role: string;
  segments: MessageSegment[];
}

export interface ToolUse {
  id: string;
  name: string;
  raw_input: string;
  input: any;
  is_input_complete: boolean;
}

// Parsed session for display
export interface ParsedSession {
  id: string; // UUID for internal use
  request_id?: string; // Human-readable request ID for UI display
  model: string;
  is_streaming: boolean;
  token_usage_input: number;
  token_usage_output: number;
  stop_reason: string;
  request: any; // Parsed from request_json
  response?: any; // Parsed from response field (unified for both streaming and non-streaming)
  tool_use?: ToolUse; // Parsed from tool_use_json
  http_req_headers?: any; // Parsed from http_req_headers JSON
  http_resp_headers?: any; // Parsed from http_resp_headers JSON
  http_status_code?: number; // HTTP status code
  created_at: Date;
  completed_at?: Date;
  status: string;
  duration_ms?: number; // Calculated from timestamps
}

// Sessions API response with pagination
export interface SessionsResponse {
  sessions: SessionRecord[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
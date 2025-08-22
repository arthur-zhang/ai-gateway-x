-- Single table schema for session storage
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    model TEXT NOT NULL,
    is_streaming BOOLEAN NOT NULL,
    token_usage_input INTEGER DEFAULT 0,
    token_usage_output INTEGER DEFAULT 0,
    stop_reason TEXT NOT NULL,
    request_json TEXT NOT NULL,
    response_messages TEXT, -- JSON array of messages
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status TEXT DEFAULT 'pending' -- pending, completed, error
);

CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_sessions_model ON sessions(model);
CREATE INDEX idx_sessions_status ON sessions(status);
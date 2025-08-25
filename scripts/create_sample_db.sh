#!/bin/bash

# 创建示例数据库文件
# Create sample database with test data

set -e

SAMPLE_DB="sessions.sample.db"

echo "🗄️  创建示例数据库文件..."

# 删除已存在的示例数据库
rm -f "$SAMPLE_DB"

# 创建示例数据库
sqlite3 "$SAMPLE_DB" << 'EOF'
-- 创建 sessions 表
CREATE TABLE sessions (
    id                 TEXT PRIMARY KEY,
    model              TEXT NOT NULL,
    is_streaming       BOOLEAN NOT NULL,
    token_usage_input  INTEGER DEFAULT 0,
    token_usage_output INTEGER DEFAULT 0,
    stop_reason        TEXT NOT NULL,
    request_json       TEXT NOT NULL,
    created_at         INTEGER,
    completed_at       INTEGER,
    status             TEXT DEFAULT 'pending',
    response           TEXT,
    http_req_headers   TEXT,
    http_resp_headers  TEXT,
    request_id         TEXT,
    http_status_code   INTEGER
);

-- 创建索引
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_sessions_model ON sessions(model);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_request_id ON sessions(request_id);

-- 插入示例数据
INSERT INTO sessions (
    id, model, is_streaming, token_usage_input, token_usage_output,
    stop_reason, request_json, created_at, status
) VALUES (
    'sample-001',
    'claude-3-5-sonnet-20241022',
    1,
    150,
    300,
    'end_turn',
    '{"messages":[{"role":"user","content":"Hello, world!"}]}',
    strftime('%s', 'now'),
    'completed'
);
EOF

echo "✅ 示例数据库创建完成: $SAMPLE_DB"
echo "💡 使用方法："
echo "   cp $SAMPLE_DB sessions.db  # 复制为实际数据库文件"
#!/bin/bash

# 数据库初始化脚本
# Database initialization script for AI Gateway X

set -e

DB_FILE="sessions.db"

echo "🗄️  初始化 SQLite 数据库..."

# 创建数据库和表
sqlite3 "$DB_FILE" << 'EOF'
-- 创建 sessions 表
CREATE TABLE IF NOT EXISTS sessions (
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
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_model ON sessions(model);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_request_id ON sessions(request_id);

-- 验证表结构
.schema sessions
EOF

echo "✅ 数据库初始化完成: $DB_FILE"
echo "📊 表结构:"
sqlite3 "$DB_FILE" ".schema sessions"
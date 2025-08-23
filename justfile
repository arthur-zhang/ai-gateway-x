#!/usr/bin/env just --justfile

# 显示所有可用命令
help:
    @just --list

# === 开发命令 ===

# 环境检查和初始化
setup:
    ./setup.sh

# 启动后端服务 (开发模式)
run:
    DATABASE_URL="sqlite:./sessions.db" cargo run --bin gateway

# 启动前端开发服务器
web:
    cd web && npm run dev

# 同时启动后端和前端 (需要 concurrently)
dev:
    #!/usr/bin/env bash
    if command -v concurrently &> /dev/null; then
        concurrently "just run" "just web"
    else
        echo "请安装 concurrently: npm install -g concurrently"
        echo "或者分别运行: just run 和 just web"
    fi

# === 生产环境 ===

# 生产环境部署：构建前端 + 后端
deploy-build: build-web build-release
    @echo "🚀 生产环境构建完成"
    @echo "启动命令: just deploy"

# 生产环境启动
deploy:
    @echo "🚀 启动生产环境服务..."
    DATABASE_URL="sqlite:./sessions.db" cargo run --bin gateway --release

# === 构建命令 ===

# 构建后端项目
build:
    cargo build --bin gateway

# 构建后端项目 (生产模式)
build-release:
    cargo build --bin gateway --release

# 构建前端项目
build-web:
    cd web && npm run build

# === 维护命令 ===

# 初始化数据库
init-db:
    ./scripts/init_db.sh

# 创建示例数据库
sample-db:
    ./scripts/create_sample_db.sh

# 重新安装前端依赖
reinstall-web:
    cd web && rm -rf node_modules package-lock.json && npm install

# 查看服务状态
status:
    @echo "检查服务状态..."
    @curl -s http://127.0.0.1:8080/api/sessions || echo "后端服务未启动"

# === 数据库工具 ===

# 查看最近的会话记录
db-recent:
    sqlite3 sessions.db "SELECT id, model, status, datetime(created_at, 'unixepoch') as created FROM sessions ORDER BY created_at DESC LIMIT 10"

# 数据库性能优化
db-optimize:
    @echo "🔧 数据库性能优化..."
    sqlite3 sessions.db "CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);"
    sqlite3 sessions.db "VACUUM; ANALYZE;"
    @echo "✅ 优化完成"

# 清理旧数据 (默认30天前)
db-cleanup days="30":
    @echo "🗑️  清理 {{days}} 天前的会话数据..."
    sqlite3 sessions.db "DELETE FROM sessions WHERE created_at < strftime('%s', 'now', '-{{days}} days')"
    @echo "✅ 清理完成"

# 数据库备份
db-backup:
    #!/usr/bin/env bash
    backup_file="sessions_backup_$(date +%Y%m%d_%H%M%S).db"
    cp sessions.db "$backup_file"
    echo "📦 数据库已备份到: $backup_file"

# === 开发工具 ===

# 代码检查
check:
    cargo check --all-targets

# 代码格式化  
fmt:
    cargo fmt --all

# 运行测试
test:
    cargo test

# 查看版本信息
version:
    @echo "🦀 Rust: $(rustc --version)"
    @echo "⚡ Just: $(just --version)"
    @echo "🟢 Node: $(node --version)"
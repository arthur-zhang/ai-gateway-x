# 🚀 AI Gateway X 快速启动指南

## ⚠️ 重要提醒

**AI Gateway X 是 Claude API 的代理和监控工具，不是 Claude 的替代品！**

要看到监控数据，你必须：
1. ✅ 配置正确的 Claude API Key
2. ✅ 将你的应用配置为通过网关访问 Claude
3. ✅ 确保网关能访问 Claude API

## 一分钟快速启动

```bash
# 1. 克隆项目
git clone <your-repo>
cd ai-gateway-x

# 2. 一键环境检查和初始化
./setup.sh

# 3. 配置 API Key（在 config.toml 中配置）

# 4. 启动服务
just run    # 后端服务
just web    # 前端服务 (新终端)
```

访问 http://127.0.0.1:8080 (后端) 和 http://localhost:5173 (前端)

## 🔧 环境要求速查

| 工具 | 版本要求 | 安装命令 |
|------|----------|----------|
| Rust | >= 1.90 (推荐 nightly) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Just | 任意版本 | `cargo install just` |
| SQLite3 | >= 3.35 | `brew install sqlite3` (macOS) |
| Node.js | >= 18 | https://nodejs.org/ |

## 📋 常用命令

```bash
just help          # 查看所有命令
just setup          # 环境检查和初始化
just run            # 启动后端服务
just web            # 启动前端服务
just dev            # 同时启动前后端 (需要安装 concurrently)
just status         # 检查服务状态
just version        # 查看工具版本信息
```

## 🔧 配置你的应用使用网关

**客户端配置示例：**
```python  
# Python 示例
import anthropic

client = anthropic.Anthropic(
    api_key="sk-ant-your-api-key",  # 与 config.toml 中配置的相同
    base_url="http://127.0.0.1:8080"  # 网关地址
)

response = client.messages.create(
    model="claude-3-sonnet-20240229",
    max_tokens=1000,
    messages=[{"role": "user", "content": "Hello"}]
)
```

**其他语言也类似，只需将 base_url 设置为网关地址，API Key 与 config.toml 中配置的保持一致。**

**测试网关是否工作：**
```bash
curl -X POST http://127.0.0.1:8080/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ant-your-api-key" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

成功后，在 http://localhost:5173 就能看到会话记录了！

## 🛠️ 故障排除

**编译错误 `edition2024`：**
```bash
rustup toolchain install nightly
rustup default nightly
```

**数据库错误：**
```bash
just init-db        # 初始化数据库
# 或
cp sessions.sample.db sessions.db
```

**前端启动失败：**
```bash
just reinstall-web  # 重新安装前端依赖
```

## 📖 更多信息

详细文档请查看 [README.md](README.md)
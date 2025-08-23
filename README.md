# AI Gateway X

AI Gateway X 是一个高性能的 AI API 网关，支持多种 AI 服务提供商的统一接入，提供请求代理、会话管理、监控统计等功能。

## 🎯 工作原理

**AI Gateway X 作为代理层工作：**

```
客户端应用 → AI Gateway X → AI 服务提供商 (Claude/OpenAI 等)
     ↑              ↓                    ↓
   使用网关API    记录会话数据           返回响应
```

**⚠️ 重要说明：**
- AI Gateway **不是** Claude 的替代品，而是 Claude API 的**代理和监控层**
- 要监控 Claude 对话，必须：
  1. 将你的应用配置为通过网关访问 Claude API
  2. 在网关中配置正确的 Claude API Key
  3. 确保网关能访问 Claude API 端点
- 网关会自动记录所有通过它的 API 请求，在 Web 界面中显示会话详情

## 🚀 快速开始

### 一键启动
```bash
git clone <your-repo-url>
cd ai-gateway-x

# 自动检查环境并安装依赖
./setup.sh

# 配置 API Key
export ANTHROPIC_API_KEY="sk-ant-your-key"

# 启动服务
just run    # 后端服务
just web    # 前端服务 (新终端)
```

**访问地址：**
- 后端 API: http://127.0.0.1:8080  
- 前端界面: http://localhost:5173

**详细安装说明：** 参见 [QUICKSTART.md](QUICKSTART.md)

## 📁 项目结构

```
ai-gateway-x/
├── config.toml            # 配置文件 
├── justfile              # 常用命令
├── setup.sh              # 一键安装脚本
├── gateway/              # 网关服务
├── anthropic/            # AI 提供商适配
└── web/                  # 前端界面
```

## ⚙️ 配置说明

### 1. 主配置文件 `config.toml`

```toml
[providers]
# Anthropic provider configuration
[providers.anthropic]
base_url = "https://api.anthropic.com"  # 官方 Claude API 端点

[server]
host = "127.0.0.1"
port = 8080

[database]
url = "./sessions.db"

[logging]
level = "info"
format = "text"  # "json" or "text"
```

### 2. API Key 配置

**设置环境变量（推荐）：**
```bash
export ANTHROPIC_API_KEY="sk-ant-api-key-here"
```

**或在启动时指定：**
```bash
ANTHROPIC_API_KEY="sk-ant-api-key-here" just run
```

### 3. 配置客户端应用

要监控 Claude 对话，需要将你的应用配置为使用网关：

**原来的配置：**
```python
# 直接调用 Claude API
import anthropic
client = anthropic.Anthropic(api_key="sk-ant-...")
```

**修改为通过网关：**
```python
# 通过网关调用（会被监控记录）
import anthropic
client = anthropic.Anthropic(
    api_key="sk-ant-...",  # 你的真实 API Key
    base_url="http://127.0.0.1:8080"  # 网关地址
)
```

**或使用 curl：**
```bash
# 通过网关发送请求
curl -X POST http://127.0.0.1:8080/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-ant-your-api-key" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```


## 🛠️ 常用命令

```bash
just run           # 启动后端服务
just web           # 启动前端服务  
just dev           # 同时启动前后端
just deploy-build  # 构建生产版本
just deploy        # 启动生产服务
just help          # 查看所有命令
```

## 🚀 生产环境部署

```bash
# 构建部署
just deploy-build

# 启动生产服务  
ANTHROPIC_API_KEY="your-key" just deploy
```

**环境变量：**
- `ANTHROPIC_API_KEY` - Claude API Key
- `DATABASE_URL` - 数据库路径（可选，默认 sqlite:./sessions.db）

**维护命令：**
```bash
just db-optimize  # 数据库优化
just db-cleanup   # 清理旧数据  
just db-backup    # 备份数据库
```

## 🐛 故障排除

**编译错误：** `rustup default nightly`  
**数据库错误：** `just init-db`  
**前端问题：** `just reinstall-web`  
**命令未找到：** `cargo install just`

完整安装说明参见 [QUICKSTART.md](QUICKSTART.md)

## 📚 主要端点

- `POST /v1/messages` - 代理 Claude API 请求
- `GET /api/sessions` - 获取会话列表  
- `GET /api/sessions/{id}` - 获取会话详情

## 📄 开源协议

MIT License
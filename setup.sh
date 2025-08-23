#!/bin/bash

# AI Gateway X 项目环境检查和初始化脚本
# Setup script for AI Gateway X project

set -e

echo "🚀 AI Gateway X 环境检查和初始化"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 已安装"
        return 0
    else
        echo -e "${RED}✗${NC} $1 未安装"
        return 1
    fi
}

check_rust_version() {
    if ! command -v rustc &> /dev/null; then
        return 1
    fi
    
    local rust_version=$(rustc --version | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
    local major=$(echo $rust_version | cut -d. -f1)
    local minor=$(echo $rust_version | cut -d. -f2)
    
    # 检查是否为 nightly 版本或者版本 >= 1.90
    if rustc --version | grep -q "nightly"; then
        echo -e "${GREEN}✓${NC} Rust nightly 版本: $(rustc --version)"
        return 0
    elif [ "$major" -gt 1 ] || ([ "$major" -eq 1 ] && [ "$minor" -ge 90 ]); then
        echo -e "${GREEN}✓${NC} Rust 版本满足要求: $rust_version"
        return 0
    else
        echo -e "${RED}✗${NC} Rust 版本过低: $rust_version (需要 >= 1.90 或 nightly)"
        return 1
    fi
}

# 1. 检查必要工具
echo -e "\n${BLUE}1. 检查必要工具${NC}"
echo "----------------"

MISSING_TOOLS=()

if ! check_rust_version; then
    MISSING_TOOLS+=("rust")
fi

if ! check_command "cargo"; then
    MISSING_TOOLS+=("cargo")
fi

if ! check_command "just"; then
    MISSING_TOOLS+=("just")
fi

if ! check_command "sqlite3"; then
    MISSING_TOOLS+=("sqlite3")
fi

if ! check_command "node"; then
    MISSING_TOOLS+=("node")
fi

if ! check_command "npm"; then
    MISSING_TOOLS+=("npm")
fi

# 2. 显示安装建议
if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    echo -e "\n${YELLOW}⚠️  缺少以下工具，请先安装:${NC}"
    
    for tool in "${MISSING_TOOLS[@]}"; do
        case $tool in
            "rust"|"cargo")
                echo -e "${YELLOW}  • Rust & Cargo:${NC} 推荐使用 nightly 版本"
                echo "    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
                echo "    rustup toolchain install nightly"
                echo "    rustup default nightly"
                ;;
            "just")
                echo -e "${YELLOW}  • Just:${NC}"
                echo "    cargo install just"
                ;;
            "sqlite3")
                echo -e "${YELLOW}  • SQLite3:${NC}"
                echo "    macOS: brew install sqlite3"
                echo "    Ubuntu: sudo apt install sqlite3"
                ;;
            "node"|"npm")
                echo -e "${YELLOW}  • Node.js & npm:${NC}"
                echo "    推荐使用 Node.js >= 18"
                echo "    https://nodejs.org/"
                ;;
        esac
    done
    echo -e "\n安装完成后请重新运行此脚本"
    exit 1
fi

# 3. 检查数据库
echo -e "\n${BLUE}2. 检查数据库${NC}"
echo "-------------"

if [ -f "sessions.db" ]; then
    echo -e "${GREEN}✓${NC} 数据库文件已存在: sessions.db"
    
    # 检查表结构
    if sqlite3 sessions.db "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions';" | grep -q "sessions"; then
        echo -e "${GREEN}✓${NC} sessions 表已存在"
    else
        echo -e "${YELLOW}⚠️${NC} sessions 表不存在，正在创建..."
        ./scripts/init_db.sh
    fi
else
    echo -e "${YELLOW}⚠️${NC} 数据库文件不存在，正在创建..."
    ./scripts/init_db.sh
fi

# 4. 检查前端依赖
echo -e "\n${BLUE}3. 检查前端依赖${NC}"
echo "---------------"

if [ -d "web/node_modules" ]; then
    echo -e "${GREEN}✓${NC} 前端依赖已安装"
else
    echo -e "${YELLOW}⚠️${NC} 前端依赖未安装，正在安装..."
    cd web && npm install && cd ..
    echo -e "${GREEN}✓${NC} 前端依赖安装完成"
fi

# 5. 构建检查
echo -e "\n${BLUE}4. 构建检查${NC}"
echo "----------"

echo "正在检查后端编译..."
if cargo check --bin gateway --quiet 2>/dev/null; then
    echo -e "${GREEN}✓${NC} 后端代码编译通过"
else
    echo -e "${RED}✗${NC} 后端代码编译失败，请检查代码"
    exit 1
fi

# 6. 完成提示
echo -e "\n${GREEN}🎉 环境检查完成！${NC}"
echo "================="
echo ""
echo -e "${YELLOW}⚠️  重要：配置 API Key${NC}"
echo -e "  ${BLUE}export ANTHROPIC_API_KEY=\"sk-ant-your-key\"${NC}"
echo ""
echo -e "${YELLOW}🚀 启动项目:${NC}"
echo -e "  ${BLUE}just run${NC}    # 后端服务"
echo -e "  ${BLUE}just web${NC}    # 前端服务 (新终端)"
echo -e "  ${BLUE}just dev${NC}    # 同时启动前后端"
echo ""
echo -e "${YELLOW}📋 其他命令:${NC}"
echo -e "  ${BLUE}just help${NC}           # 查看所有命令"
echo -e "  ${BLUE}just deploy-build${NC}   # 构建生产版本"  
echo -e "  ${BLUE}just status${NC}         # 检查服务状态"
echo ""
echo -e "访问地址:"
echo -e "  ${BLUE}后端 API:${NC} http://127.0.0.1:8080"
echo -e "  ${BLUE}前端界面:${NC} http://localhost:5173"
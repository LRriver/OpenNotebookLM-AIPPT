#!/bin/bash

# AI PPT Generator - 一键启动脚本
# 同时启动前端和后端服务

echo "🚀 AI PPT Generator 启动中..."
echo "================================================"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认端口
BACKEND_PORT=8000
FRONTEND_PORT=5173

# 进程 ID
BACKEND_PID=""
FRONTEND_PID=""

# 检查端口是否被占用
check_port() {
    local port=$1
    (echo >/dev/tcp/localhost/$port) 2>/dev/null
    return $?
}

# 查找可用端口
find_available_port() {
    local start_port=$1
    local port=$start_port
    local max_port=$((start_port + 100))
    
    while [ $port -lt $max_port ]; do
        if ! check_port $port; then
            echo $port
            return
        fi
        port=$((port + 1))
    done
    
    echo $start_port
}

# 检查 Python 依赖
check_python_deps() {
    echo -e "${BLUE}📦 检查 Python 依赖...${NC}"
    if ! python -c "import fastapi" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  检测到缺少 Python 依赖，正在安装...${NC}"
        pip install -r requirements.txt
    fi
    echo -e "${GREEN}✅ Python 依赖已就绪${NC}"
}

# 检查 Node.js 依赖
check_node_deps() {
    echo -e "${BLUE}📦 检查 Node.js 依赖...${NC}"
    if [ ! -d "web/node_modules" ]; then
        echo -e "${YELLOW}⚠️  检测到缺少 Node.js 依赖，正在安装...${NC}"
        cd web
        npm install
        cd ..
    fi
    echo -e "${GREEN}✅ Node.js 依赖已就绪${NC}"
}

# 启动后端服务
start_backend() {
    # 检查并获取可用端口
    local original_port=$BACKEND_PORT
    BACKEND_PORT=$(find_available_port $BACKEND_PORT)
    
    if [ "$BACKEND_PORT" != "$original_port" ]; then
        echo -e "${YELLOW}⚠️  端口 $original_port 已被占用，使用端口 $BACKEND_PORT${NC}"
    fi
    
    echo -e "${BLUE}� 启动后端 API 服务器 (端口: $BACKEND_PORT)...${NC}"
    python -m uvicorn api.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload &
    BACKEND_PID=$!
    echo -e "${GREEN}✅ 后端服务已启动 (PID: $BACKEND_PID)${NC}"
}

# 启动前端服务
start_frontend() {
    # 检查并获取可用端口
    local original_port=$FRONTEND_PORT
    FRONTEND_PORT=$(find_available_port $FRONTEND_PORT)
    
    if [ "$FRONTEND_PORT" != "$original_port" ]; then
        echo -e "${YELLOW}⚠️  端口 $original_port 已被占用，使用端口 $FRONTEND_PORT${NC}"
    fi
    
    echo -e "${BLUE}🎨 启动前端开发服务器 (端口: $FRONTEND_PORT)...${NC}"
    cd web
    npm run dev -- --port $FRONTEND_PORT &
    FRONTEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ 前端服务已启动 (PID: $FRONTEND_PID)${NC}"
}

# 清理函数
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 正在停止服务...${NC}"
    
    # 停止后端（先用 PID，再用 pkill 确保清理干净）
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        # 等待进程结束
        sleep 1
        # 强制终止（如果还在运行）
        kill -9 $BACKEND_PID 2>/dev/null || true
    fi
    # 清理所有 uvicorn 相关进程（包括子进程）
    pkill -f "uvicorn.*api.main" 2>/dev/null || true
    sleep 0.5
    pkill -9 -f "uvicorn.*api.main" 2>/dev/null || true
    echo -e "${GREEN}✅ 后端服务已停止${NC}"
    
    # 停止前端
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 1
        kill -9 $FRONTEND_PID 2>/dev/null || true
    fi
    # 清理所有 vite 相关进程
    pkill -f "vite.*--port" 2>/dev/null || true
    sleep 0.5
    pkill -9 -f "vite.*--port" 2>/dev/null || true
    echo -e "${GREEN}✅ 前端服务已停止${NC}"
    
    echo -e "${GREEN}👋 服务已全部停止，再见！${NC}"
    exit 0
}

# 捕获退出信号
trap cleanup SIGINT SIGTERM

# 主流程
main() {
    # 检查依赖
    check_python_deps
    check_node_deps
    
    echo ""
    echo "================================================"
    
    # 启动后端服务
    start_backend
    
    # 等待后端启动
    sleep 2
    
    # 启动前端服务
    start_frontend
    
    echo ""
    echo "================================================"
    echo -e "${GREEN}🎉 AI PPT Generator 已成功启动！${NC}"
    echo ""
    echo -e "📍 前端地址: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "📍 后端地址: ${BLUE}http://localhost:$BACKEND_PORT${NC}"
    echo -e "📚 API 文档: ${BLUE}http://localhost:$BACKEND_PORT/docs${NC}"
    echo ""
    echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
    echo "================================================"
    
    # 等待进程
    wait
}

# 运行主流程
main

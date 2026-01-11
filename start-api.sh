#!/bin/bash

# 启动 FastAPI 后端服务器

echo "🚀 启动 AI PPT Generator API 服务器..."
echo "================================================"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认端口
BACKEND_PORT=8000

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

# 检查是否安装了依赖
echo -e "${BLUE}📦 检查 Python 依赖...${NC}"
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  检测到缺少依赖，正在安装...${NC}"
    pip install -r requirements.txt
fi
echo -e "${GREEN}✅ Python 依赖已就绪${NC}"

# 检查并获取可用端口
original_port=$BACKEND_PORT
BACKEND_PORT=$(find_available_port $BACKEND_PORT)

if [ "$BACKEND_PORT" != "$original_port" ]; then
    echo -e "${YELLOW}⚠️  端口 $original_port 已被占用，使用端口 $BACKEND_PORT${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✅ API 服务器启动中...${NC}"
echo -e "📍 访问地址: ${BLUE}http://localhost:$BACKEND_PORT${NC}"
echo -e "📚 API 文档: ${BLUE}http://localhost:$BACKEND_PORT/docs${NC}"
echo -e "${YELLOW}按 Ctrl+C 停止服务${NC}"
echo "================================================"
echo ""

# 启动服务器
python -m uvicorn api.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload

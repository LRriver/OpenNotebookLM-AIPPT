#!/bin/bash

# 启动 FastAPI 后端服务器

echo "🚀 启动 AI PPT Generator API 服务器..."
echo "================================================"

# 检查是否安装了依赖
if ! python -c "import fastapi" 2>/dev/null; then
    echo "⚠️  检测到缺少依赖，正在安装..."
    pip install -r requirements.txt
fi

# 启动服务器
cd "$(dirname "$0")"
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

echo "================================================"
echo "✅ API 服务器已启动"
echo "📍 访问地址: http://localhost:8000"
echo "📚 API 文档: http://localhost:8000/docs"
echo "================================================"

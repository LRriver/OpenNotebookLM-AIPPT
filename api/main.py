"""
FastAPI 应用入口
提供 WebUI 前端所需的 API 接口
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# 导入路由
from .routes import upload, generate, edit, export

# 创建 FastAPI 应用
app = FastAPI(
    title="AI PPT Generator API",
    description="API for AI-powered PPT generation with WebUI",
    version="1.0.0"
)

# 配置 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {"status": "ok", "message": "API is running"}


# 注册路由（必须在静态文件挂载之前）
app.include_router(upload.router)
app.include_router(generate.router)
app.include_router(edit.router)
app.include_router(export.router)

# 静态文件服务（用于前端）
# 检查 web/dist 目录是否存在，必须放在最后
web_dist_path = Path(__file__).parent.parent / "web" / "dist"
if web_dist_path.exists():
    app.mount("/", StaticFiles(directory=str(web_dist_path), html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

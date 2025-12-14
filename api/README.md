# AI PPT Generator API

FastAPI 后端服务，为 WebUI 前端提供 PPT 生成、编辑和导出功能。

## 功能特性

- **文件上传**: 支持上传 Markdown 文件作为输入材料
- **PPT 生成**: 基于输入材料生成 PPT 幻灯片，支持流式返回进度
- **图生图编辑**: 对单页幻灯片进行修改
- **导出功能**: 支持导出为 PDF 和 PPTX 格式

## API 端点

### 健康检查
```
GET /api/health
```

### 文件上传
```
POST /api/upload
Content-Type: multipart/form-data

参数:
- file: Markdown 文件 (.md)

响应:
{
  "success": true,
  "content": "文件内容",
  "filename": "文件名.md",
  "message": "文件上传成功"
}
```

### PPT 生成
```
POST /api/generate
Content-Type: application/json

请求体:
{
  "content": "Markdown 内容",
  "config": {
    "api_key": "your-api-key",
    "base_url": "https://api.example.com",
    "page_count": 10,
    "quality": "1K",
    "aspect_ratio": "16:9"
  }
}

响应: Server-Sent Events (SSE) 流
- type: "progress" - 进度更新
- type: "slide" - 单页幻灯片生成完成
- type: "complete" - 全部完成
- type: "error" - 错误信息
```

### 图生图编辑
```
POST /api/edit
Content-Type: application/json

请求体:
{
  "image_base64": "base64编码的图片",
  "instruction": "修改指令",
  "config": {
    "api_key": "your-api-key",
    "base_url": "https://api.example.com",
    "quality": "1K",
    "aspect_ratio": "16:9"
  }
}

响应:
{
  "success": true,
  "image_base64": "base64编码的新图片",
  "message": "编辑成功"
}
```

### 导出
```
POST /api/export
Content-Type: application/json

请求体:
{
  "slides": [
    {"image_base64": "base64编码的图片"}
  ],
  "format": "pdf" | "pptx"
}

响应: 文件下载
```

## 启动服务器

### 方式 1: 使用启动脚本
```bash
./start-api.sh
```

### 方式 2: 直接使用 uvicorn
```bash
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

## 访问 API 文档

启动服务器后，访问以下地址查看交互式 API 文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 依赖项

所有依赖已添加到项目根目录的 `requirements.txt` 文件中：

- fastapi>=0.104.0
- uvicorn>=0.24.0
- python-multipart>=0.0.6
- python-pptx>=0.6.21

## 项目结构

```
api/
├── __init__.py
├── main.py              # FastAPI 应用入口
├── models.py            # Pydantic 数据模型
├── routes/
│   ├── __init__.py
│   ├── upload.py        # 文件上传路由
│   ├── generate.py      # PPT 生成路由
│   ├── edit.py          # 图生图编辑路由
│   └── export.py        # 导出路由
└── README.md
```

## 与现有模块集成

API 服务器直接使用项目中现有的 Python 模块：

- `src.generator.PPTGenerator` - PPT 生成器
- `src.client.AIClient` - AI 客户端
- `src.exporter.PDFExporter` - PDF 导出器
- `src.config` - 配置管理

## 开发说明

### CORS 配置

当前配置允许所有来源访问 API（`allow_origins=["*"]`）。在生产环境中，应该设置具体的前端域名。

### 静态文件服务

如果 `web/dist` 目录存在，API 服务器会自动提供前端静态文件服务。

### 错误处理

所有路由都包含适当的错误处理，返回结构化的错误响应。

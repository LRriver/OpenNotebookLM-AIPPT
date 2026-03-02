# AI PPT 生成器

[English](README_en.md) | [中文](README.md)

复刻 NotebookLM 的 AI PPT 功能，将论文、文档等资料自动转换为精美的 PPT 图片。

## ✨ 功能特性

- 🎨 **AI 图片生成**：使用 AI 模型将文档内容转换为精美的 PPT 图片
- 🌐 **WebUI 界面**：提供友好的 Web 界面，支持文件上传、实时预览、编辑和导出
- 📝 **多格式支持**：支持 Markdown 文档输入，PDF/PPTX 格式导出
- ✏️ **图生图编辑**：支持对生成的幻灯片进行二次编辑修改
- 💾 **状态持久化**：自动保存工作进度，支持会话恢复

## 🚀 快速开始

### 1. 安装配置

```bash
# 克隆项目
git clone <repository-url>
cd OpenNotebookLM-AIPPT

# 配置 API 密钥
cp config.example.yaml config.yaml
# 编辑 config.yaml，填入你的 API 密钥
```

### 2. 启动服务

**方式一：WebUI 界面（推荐）**

```bash
# 一键启动前后端
./start.sh
```

启动后访问：
- 🎨 前端界面: http://localhost:5173
- 📚 API 文档: http://localhost:8000/docs

**方式二：分别启动前后端**

```bash
# 终端 1：启动后端
./start-api.sh

# 终端 2：启动前端
cd web && npm install && npm run dev
```

**方式三：命令行使用**

```bash
# 安装依赖
pip install -r requirements.txt

# 基础用法
python main.py -i doc/sample_paper.txt -n 5

# 仅生成 Prompt
python main.py -i doc/sample_paper.txt -n 5 --prompt-only -o prompts.json

# 从 Prompt 文件生成
python main.py --from-prompt prompts.json
```

### 3. WebUI 使用流程

1. **上传文档**：在左侧面板拖拽或点击上传 Markdown 文件
2. **配置 API**：在中间面板填写 API Key 和 Base URL
3. **设置参数**：选择页数、清晰度、比例等生成参数
4. **生成 PPT**：点击"开始生成"按钮，实时查看生成进度
5. **预览编辑**：在右侧面板预览生成的幻灯片，点击可进行编辑
6. **导出文件**：选择 PDF 或 PPTX 格式导出

## 📁 项目结构

```
OpenNotebookLM-AIPPT/
├── src/                    # 核心逻辑
├── api/                    # FastAPI 后端
├── web/                    # React 前端
├── tests/                  # 测试
├── doc/                    # 输入文档目录
├── config.yaml             # 配置文件
├── start.sh                # 一键启动脚本
└── main.py                 # 命令行入口
```

## ⚙️ 配置说明

所有配置统一在 `config.yaml` 中管理，包括：
- API 配置（图像生成、文本生成）
- PPT 默认配置（语言、风格、页数）
- 超时和重试配置

详细配置示例请参考 `config.example.yaml`。

### 使用 OpenAI 兼容 API

```yaml
api:
  text:
    format: "openai"
    model: "gpt-4o"
    base_url: "https://api.openai.com/v1"
    api_key: "sk-xxx"
```

## 📤 输出结构

```
output/ppt_20241201_123456/
├── source_material.txt      # 原始输入资料
├── prompts.json             # 生成的 Prompt
├── result.json              # 生成结果
├── presentation.pdf         # 导出的 PDF
└── images/                  # 幻灯片图片
```

## 📋 TODO

- [ ] 🔌 兼容更多 LLM API 接口
- [ ] 💾 兼容多种输入格式，更多导出格式

## 📄 许可证

Apache License 2.0

# AI PPT 生成器

[English](README_en.md) | [中文](README.md)

复刻 NotebookLM 的 AI PPT 功能，并进一步增强为可控、可编辑、可自定义模型的 PPT 生成工作台，支持将论文、文档等资料自动转换为精美的 PPT 图片。

![AIPPT 工作台演示](docs/assets/aippt-demo.gif)

[查看高清演示视频](docs/assets/aippt-demo.webm)

演示视频覆盖上传 `doc/L9.md`、填写用户要求、生成并编辑设计大纲、确认逐页设计、生成 6 页 PPT、单页编辑、确认替换、导出 PDF/PPTX；模型等待阶段已做快进剪辑。

## 为什么不只是复刻

NotebookLM 的 PPT 能力更像“一键生成结果”，中间设计过程和单页调整空间相对有限。本项目把生成链路拆成用户可理解、可干预的工作台流程：

- **过程可见**：先展示 PPT 大纲和逐页设计说明，用户确认后再生成图片
- **逐页可改**：每一页都能单独编辑、生成新版本、回退历史并确认替换
- **模型可控**：文本规划、生图、图片编辑可分别配置不同 OpenAI-compatible 模型
- **本地可跑**：配置保存在本地 `config.yaml`，API Key 不会暴露给前端或浏览器
- **结果可导出**：生成后可直接导出 PDF/PPTX，适合继续汇报或二次编辑

## ✨ 功能特性

- 🎨 **逐页图片生成**：先生成可编辑设计大纲和逐页设计，再使用 AI 模型转换为 PPT 页面图片
- 🌐 **PPT 工作台**：支持资料上传、模型配置、当前页大预览、缩略图列表、编辑历史和导出
- 📝 **多格式解析**：支持 `.md/.txt/.pdf/.docx/.pptx` 输入，统一转 Markdown 后生成
- ✏️ **整页图像编辑**：支持对每页幻灯片单独二次编辑、历史回退和确认替换
- 🔀 **三模型角色**：支持 `prompt_model`、`image_model`、`edit_model` 分别配置
- 🖼️ **图像结果兼容**：兼容 URL、Markdown 图片链接、data URL、`b64_json` 和纯 base64
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
python main.py -i doc/L9.md -n 5

# 仅生成 Prompt
python main.py -i doc/L9.md -n 5 --prompt-only -o prompts.json

# 从 Prompt 文件生成
python main.py --from-prompt prompts.json
```

### 3. WebUI 使用流程

1. **上传文档**：在左侧面板拖拽或点击上传资料文件
2. **配置模型**：在中间面板配置文本、生图和编辑模型
3. **设置参数与要求**：选择页数、清晰度、比例、语言、风格、受众，并填写用户定制要求
4. **确认设计**：先生成设计大纲，用户可编辑后确认，再生成逐页设计预览
5. **生成 PPT**：确认逐页设计后生成 PPT 图片，实时查看进度
6. **预览编辑**：在右侧面板预览生成的幻灯片，点击可进行单页编辑
7. **导出文件**：选择 PDF 或 PPTX 格式导出

仓库内置演示资料为 `doc/L9.md`。该路径是仓库相对路径，clone 后可直接用于 WebUI 上传或命令行示例。

## 📁 项目结构

```
OpenNotebookLM-AIPPT/
├── src/                    # 核心逻辑
├── api/                    # FastAPI 后端
├── web/                    # React 前端
├── tests/                  # 测试
├── doc/                    # 输入文档目录
│   └── L9.md               # 默认演示资料
├── config.yaml             # 配置文件
├── start.sh                # 一键启动脚本
└── main.py                 # 命令行入口
```

## ⚙️ 配置说明

所有配置统一在 `config.yaml` 中管理，包括：
- API 配置（文本 prompt、生图、编辑三角色模型）
- PPT 默认配置（语言、风格、页数）
- 超时和重试配置

详细配置示例请参考 `config.example.yaml`。

### 使用 OpenAI 兼容 API

```yaml
api:
  models:
    prompt_model:
      adapter: "openai_chat"
      model: "gpt-4o"
      base_url: "https://api.openai.com/v1"
      api_key: "sk-xxx"
    image_model:
      adapter: "raw_chat_multimodal"
      model: "gpt-image-2"
      base_url: "https://api.example.com/v1"
      api_key: "sk-xxx"
    edit_model:
      adapter: "raw_chat_multimodal"
      model: "gpt-image-2"
      base_url: "https://api.example.com/v1"
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

- [ ] 支持框选局部区域编辑
- [ ] 增加更多 provider profile 模板

## 📄 许可证

Apache License 2.0

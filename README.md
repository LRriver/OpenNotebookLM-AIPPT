# AI PPT 生成器

将论文、文档等资料自动转换为精美的 PPT 图片，类似 NotebookLM 的 AI PPT 功能。

## 项目结构

```
open-notebboklm-aippt/
├── src/                        # 源代码（核心逻辑）
│   ├── __init__.py            # 包入口
│   ├── config.py              # 配置管理（统一配置入口）
│   ├── client.py              # AI 客户端
│   ├── models.py              # 数据模型
│   ├── prompts/               # Prompt 模版（解耦）
│   │   ├── __init__.py
│   │   └── templates.py
│   ├── prompt_generator.py    # Prompt 生成器
│   ├── image_generator.py     # 图片生成器
│   ├── exporter.py            # PDF 导出器
│   └── generator.py           # 主生成器
├── tests/                      # 测试（调用 src 接口）
│   └── test_generator.py
├── doc/                        # 输入文档目录
│   └── sample_paper.txt
├── config.yaml                 # 统一配置文件
├── main.py                     # 命令行入口
├── requirements.txt
└── README.md
```

## 配置管理

所有配置统一在 `config.yaml` 中管理：

```yaml
# API 配置
api:
  # 图像生成 API 配置（必填）
  image:
    api_key: "your-image-api-key"
    base_url: "https://magic666.top"
    model: "gemini-3-pro-image-preview"
  
  # 文本生成 API 配置
  text:
    format: "gemini"  # "gemini" 或 "openai"
    model: "gemini-3-pro-preview"
    
    # 如果使用不同的 API 源（可选）
    # api_key: "your-text-api-key"
    # base_url: "https://api.openai.com/v1"

# PPT 默认配置
ppt:
  language: "中文"
  style: "现代简约商务风格"
  num_pages: 10
  # ...

# 输出配置
output:
  dir: "output"

# 文档配置
doc:
  dir: "doc"
  sample_file: "sample_paper.txt"
```

### 使用 OpenAI 兼容 API

如果你想用 OpenAI 格式的 API（如 OpenAI、DeepSeek、通义千问等）生成 Prompt：

```yaml
api:
  text:
    format: "openai"
    model: "gpt-4o"
    base_url: "https://api.openai.com/v1"
    api_key: "sk-xxx"
```

## 快速开始

### 安装依赖

```bash
pip install -r requirements.txt
```

### 配置 API

```bash
# 复制示例配置文件
cp config.example.yaml config.yaml

# 编辑配置文件，填入你的 API 密钥
nano config.yaml  # 或使用其他编辑器
```

### 运行测试

```bash
# 仅测试 Prompt 生成
python tests/test_generator.py --mode prompt

# 完整测试（生成图片）
python tests/test_generator.py --mode full

# 从 Prompt 文件生成图片
python tests/test_generator.py --mode from-prompt
```

### 命令行使用

```bash
# 基础用法
python main.py -i doc/sample_paper.txt -n 5

# 仅生成 Prompt
python main.py -i doc/sample_paper.txt -n 5 --prompt-only -o prompts.json

# 从 Prompt 文件生成
python main.py --from-prompt prompts.json
```

### 代码调用

```python
from src import PPTGenerator, PPTConfig, load_sample_material

# 加载资料（从配置的文档目录）
material = load_sample_material()

# 创建生成器（配置从 config.yaml 读取）
generator = PPTGenerator()

# 生成（仅覆盖需要的参数）
result = generator.generate(material, PPTConfig(num_pages=5))
print(f"输出目录: {result.project_dir}")
```

## 工作流程

```
输入资料 + 用户需求
        ↓
【Step 1】保存输入资料
        ↓
【Step 2】生成 Prompt
    ├── 2.1 调用 LLM 生成初始 Prompt（图文并茂）
    └── 2.2 调用 LLM 检查优化 Prompt
        ↓
【Step 3】并行生成 PPT 页面图片（文生图）
        ↓
【Step 4】导出 PDF
```

## 输出结构

```
output/ppt_20241201_123456/
├── source_material.txt      # 原始输入资料
├── prompts.json             # 生成的 Prompt
├── result.json              # 生成结果
├── presentation.pdf         # 导出的 PDF
└── images/
    ├── slide_001.png
    ├── slide_002.png
    └── ...
```

## TODO

- [ ] WebUI 界面
- [ ] API 服务接口
- [ ] 更多导出格式

## 许可证

MIT License

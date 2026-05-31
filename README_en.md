# AI PPT Generator

[English](README_en.md) | [中文](README.md)

Recreate NotebookLM's AI PPT feature to automatically convert papers, documents, and other materials into beautiful PPT images.

![AIPPT workbench demo](docs/assets/aippt-demo.gif)

[Watch the HD demo video](docs/assets/aippt-demo.webm)

The demo covers uploading `doc/L9.md`, entering custom requirements, generating and editing the design outline, confirming page designs, generating a 6-slide deck, editing one slide, confirming the replacement, and exporting PDF/PPTX. Model waiting time is fast-forwarded.

## ✨ Features

- 🎨 **Per-slide image generation**: Create an editable outline and page designs before converting them into PPT page images
- 🌐 **PPT Workbench**: Upload sources, configure model roles, preview slides, edit pages, track history, and export
- 📝 **Multi-format parsing**: Supports `.md/.txt/.pdf/.docx/.pptx` input and converts content to Markdown
- ✏️ **Full-page image editing**: Edit each generated slide independently, revert history, and confirm replacements
- 🔀 **Three model roles**: Configure `prompt_model`, `image_model`, and `edit_model` separately
- 🖼️ **Image result compatibility**: Accepts URLs, Markdown image links, data URLs, `b64_json`, and raw base64
- 💾 **State Persistence**: Auto-save work progress with session recovery

## 🚀 Quick Start

### 1. Installation & Configuration

```bash
# Clone the project
git clone <repository-url>
cd OpenNotebookLM-AIPPT

# Configure API keys
cp config.example.yaml config.yaml
# Edit config.yaml and fill in your API keys
```

### 2. Start Services

**Option 1: WebUI Interface (Recommended)**

```bash
# One-click start for both frontend and backend
./start.sh
```

After startup, visit:
- 🎨 Frontend: http://localhost:5173
- 📚 API Docs: http://localhost:8000/docs

**Option 2: Start Frontend and Backend Separately**

```bash
# Terminal 1: Start backend
./start-api.sh

# Terminal 2: Start frontend
cd web && npm install && npm run dev
```

**Option 3: Command Line Usage**

```bash
# Install dependencies
pip install -r requirements.txt

# Basic usage
python main.py -i doc/L9.md -n 5

# Generate prompts only
python main.py -i doc/L9.md -n 5 --prompt-only -o prompts.json

# Generate from prompt file
python main.py --from-prompt prompts.json
```

### 3. WebUI Usage Flow

1. **Upload Document**: Drag and drop or click to upload a source file in the left panel
2. **Configure Models**: Configure text, image generation, and image editing model roles
3. **Set Parameters & Requirements**: Choose page count, resolution, aspect ratio, language, style, audience, and custom requirements
4. **Confirm Design**: Generate an editable outline, confirm it, then review the generated page designs
5. **Generate PPT**: Generate slide images after page-design confirmation and watch real-time progress
6. **Preview & Edit**: Preview generated slides in the right panel and edit a single page when needed
7. **Export**: Export to PDF or PPTX

The built-in demo source is `doc/L9.md`. This is a repository-relative path, so a fresh clone can use it directly in the WebUI or CLI examples.

## 📁 Project Structure

```
OpenNotebookLM-AIPPT/
├── src/                    # Core logic
├── api/                    # FastAPI backend
├── web/                    # React frontend
├── tests/                  # Tests
├── doc/                    # Input documents directory
│   └── L9.md               # Default demo source
├── config.yaml             # Configuration file
├── start.sh                # One-click startup script
└── main.py                 # CLI entry point
```

## ⚙️ Configuration

All configurations are managed in `config.yaml`, including:
- API configuration (`prompt_model`, `image_model`, `edit_model`)
- PPT default settings (language, style, page count)
- Timeout and retry settings

See `config.example.yaml` for detailed configuration examples.

### Using OpenAI Compatible API

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

## 📤 Output Structure

```
output/ppt_20241201_123456/
├── source_material.txt      # Original input material
├── prompts.json             # Generated prompts
├── result.json              # Generation result
├── presentation.pdf         # Exported PDF
└── images/                  # Slide images
```

## 📋 TODO

- [ ] Support region selection for partial slide editing
- [ ] Add more provider profile templates

## 📄 License

Apache License 2.0

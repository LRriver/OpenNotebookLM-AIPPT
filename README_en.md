# AI PPT Generator

[English](README_en.md) | [中文](README.md)

Recreate NotebookLM's AI PPT feature to automatically convert papers, documents, and other materials into beautiful PPT images.

## ✨ Features

- 🎨 **AI Image Generation**: Use AI models to convert document content into beautiful PPT images
- 🌐 **WebUI Interface**: User-friendly web interface with file upload, real-time preview, editing, and export
- 📝 **Multi-format Support**: Markdown document input, PDF/PPTX format export
- ✏️ **Image-to-Image Editing**: Support secondary editing of generated slides
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
python main.py -i doc/sample_paper.txt -n 5

# Generate prompts only
python main.py -i doc/sample_paper.txt -n 5 --prompt-only -o prompts.json

# Generate from prompt file
python main.py --from-prompt prompts.json
```

### 3. WebUI Usage Flow

1. **Upload Document**: Drag and drop or click to upload Markdown files in the left panel
2. **Configure API**: Fill in API Key and Base URL in the center panel
3. **Set Parameters**: Choose page count, resolution, aspect ratio, etc.
4. **Generate PPT**: Click "Start Generation" button and watch real-time progress
5. **Preview & Edit**: Preview generated slides in the right panel, click to edit
6. **Export**: Choose PDF or PPTX format to export

## 📁 Project Structure

```
OpenNotebookLM-AIPPT/
├── src/                    # Core logic
├── api/                    # FastAPI backend
├── web/                    # React frontend
├── tests/                  # Tests
├── doc/                    # Input documents directory
├── config.yaml             # Configuration file
├── start.sh                # One-click startup script
└── main.py                 # CLI entry point
```

## ⚙️ Configuration

All configurations are managed in `config.yaml`, including:
- API configuration (image generation, text generation)
- PPT default settings (language, style, page count)
- Timeout and retry settings

See `config.example.yaml` for detailed configuration examples.

### Using OpenAI Compatible API

```yaml
api:
  text:
    format: "openai"
    model: "gpt-4o"
    base_url: "https://api.openai.com/v1"
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

- [ ] 🔌 Support more LLM API interfaces
- [ ] 💾 Support multiple input formats and export formats

## 📄 License

Apache License 2.0

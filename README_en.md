# AI PPT Generator

[English](README.md) | [中文](README_zh.md)

Recreate NotebookLM's AI PPT feature to automatically convert papers, documents, and other materials into beautiful PPT images.

## Project Structure

```
open-notebboklm-aippt/
├── src/                        # Source code (core logic)
│   ├── __init__.py            # Package entry
│   ├── config.py              # Configuration management
│   ├── client.py              # AI client
│   ├── models.py              # Data models
│   ├── prompts/               # Prompt templates (decoupled)
│   │   ├── __init__.py
│   │   └── templates.py
│   ├── prompt_generator.py    # Prompt generator
│   ├── image_generator.py     # Image generator
│   ├── exporter.py            # PDF exporter
│   └── generator.py           # Main generator
├── tests/                      # Tests
│   └── test_generator.py
├── doc/                        # Input documents directory
│   └── sample_paper.txt
├── config.yaml                 # Unified configuration file
├── main.py                     # CLI entry point
├── requirements.txt
└── README.md
```

## Configuration Management

All configurations are managed in `config.yaml`:

```yaml
# API Configuration
api:
  # Image generation API configuration (required)
  image:
    api_key: "your-image-api-key"
    base_url: "your-base-url"
    model: "gemini-3-pro-image-preview"
  
  # Text generation API configuration
  text:
    format: "gemini"  # "gemini" or "openai"
    model: "gemini-3-pro-preview"
    
    # Thinking depth configuration (only for Gemini 3+ series)
    thinking_level: "high"  # "low", "high", or null
    
    # If using different API source (optional)
    # api_key: "your-text-api-key"
    # base_url: "https://api.openai.com/v1"

# PPT default configuration
ppt:
  language: "English"
  style: "Modern minimalist business style"
  num_pages: 10
  # ...

# Output configuration
output:
  dir: "output"

# Document configuration
doc:
  dir: "doc"
  sample_file: "sample_paper.txt"

# Timeout configuration
timeout:
  text_generation: 120      # Text generation timeout (seconds)
  image_generation: 180     # Single image generation timeout (seconds)
  buffer: 60                # Buffer time for global timeout calculation (seconds)
```

### Using OpenAI Compatible API

If you want to use OpenAI-format APIs (like OpenAI, DeepSeek, Qwen, etc.) to generate prompts:

```yaml
api:
  text:
    format: "openai"
    model: "gpt-4o"
    base_url: "https://api.openai.com/v1"
    api_key: "sk-xxx"
```

### Thinking Depth Configuration

For Gemini 3+ series models that support thinking functionality, you can configure thinking depth:

```yaml
api:
  text:
    model: "gemini-3-pro-preview-thinking"
    thinking_level: "high"  # "low" or "high"
```

- `"low"`: Fast thinking, suitable for simple tasks
- `"high"`: Deep thinking, suitable for complex reasoning tasks
- `null` or not configured: Don't use thinking functionality

**Note**: Thinking functionality is only available in Gemini 3 and higher versions. Other models will automatically ignore this configuration.

## Quick Start

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure API

```bash
# Copy example configuration file
cp config.example.yaml config.yaml

# Edit configuration file and fill in your API keys
nano config.yaml  # or use other editors
```

### Run Tests

```bash
# Test prompt generation only
python tests/test_generator.py --mode prompt

# Full test (generate images)
python tests/test_generator.py --mode full

# Generate images from prompt file
python tests/test_generator.py --mode from-prompt
```

### Command Line Usage

```bash
# Basic usage
python main.py -i doc/sample_paper.txt -n 5

# Generate prompts only
python main.py -i doc/sample_paper.txt -n 5 --prompt-only -o prompts.json

# Generate from prompt file
python main.py --from-prompt prompts.json
```

### Code Usage

```python
from src import PPTGenerator, PPTConfig, load_sample_material

# Load material (from configured document directory)
material = load_sample_material()

# Create generator (configuration read from config.yaml)
generator = PPTGenerator()

# Generate (only override necessary parameters)
result = generator.generate(material, PPTConfig(num_pages=5))
print(f"Output directory: {result.project_dir}")
```

## Workflow

```
Input Material + User Requirements
        ↓
【Step 1】Save input material
        ↓
【Step 2】Generate prompts
    ├── 2.1 Call LLM to generate initial prompts (text and images)
    └── 2.2 Call LLM to review and optimize prompts
        ↓
【Step 3】Generate PPT page images in parallel (text-to-image)
        ↓
【Step 4】Export to PDF
```

## Timeout and Retry Mechanisms

The project implements comprehensive timeout and retry mechanisms:

### Three-Layer Timeout Control

1. **Global timeout**: Calculated as `ceil(tasks/concurrency) × single_timeout + buffer`
   - Prevents infinite waiting for all tasks
   - Automatically cancels remaining tasks on timeout

2. **Single task timeout**: 180 seconds per image generation task
   - Allows retries to complete within the timeout
   - Uses `future.result(timeout=180)`

3. **API call level**: OpenAI client timeout (120s for text generation)
   - Prevents individual API calls from hanging

### Retry Logic

- **Prompt generation**: 
  - 3 retries for initial generation
  - 2 retries for optimization
  - Automatic retry on JSON parsing errors

- **Image generation**: 
  - 3 retries per task (in `_generate_single_slide`)
  - Exponential backoff between retries

- **JSON parsing**: 
  - Multiple extraction methods (direct JSON, ```json blocks, ``` blocks)
  - Enhanced error messages for debugging

## Output Structure

```
output/ppt_20241201_123456/
├── source_material.txt      # Original input material
├── prompts.json             # Generated prompts
├── result.json              # Generation result
├── presentation.pdf         # Exported PDF
└── images/
    ├── slide_001.png
    ├── slide_002.png
    └── ...
```

## TODO
- [ ] 🌐 WebUI Interface (coming soon)
- [ ] 🔌 Support more LLM API interfaces
- [ ] 💾 Support multiple input formats and export formats
- [ ] ✏️ Specify page modification

## License

Apache License 2.0

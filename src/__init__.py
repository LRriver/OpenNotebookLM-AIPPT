"""
AI PPT Generator
将资料转换为精美的 PPT 图片
"""

from .config import PPTConfig, APIConfig, load_sample_material, get_output_dir, get_doc_dir
from .generator import PPTGenerator
from .prompts import PromptTemplates

__version__ = "0.1.0"
__all__ = [
    "PPTConfig", "APIConfig", "PPTGenerator", "PromptTemplates",
    "load_sample_material", "get_output_dir", "get_doc_dir"
]

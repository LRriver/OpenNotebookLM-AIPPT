"""
配置模块
定义所有配置类，支持从 YAML 文件加载
"""

import os
from dataclasses import dataclass, asdict
from typing import Dict, Any, Literal, Optional
from pathlib import Path

import yaml


# 配置文件路径
CONFIG_FILE = Path(__file__).parent.parent / "config.yaml"


def load_yaml_config() -> Dict[str, Any]:
    """加载 YAML 配置文件"""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f) or {}
    return {}


# 全局配置缓存
_config_cache: Optional[Dict[str, Any]] = None


def get_config() -> Dict[str, Any]:
    """获取配置（带缓存）"""
    global _config_cache
    if _config_cache is None:
        _config_cache = load_yaml_config()
    return _config_cache


def reload_config():
    """重新加载配置"""
    global _config_cache
    _config_cache = load_yaml_config()
    return _config_cache


@dataclass
class APIConfig:
    """API 配置"""
    # 图像生成 API 配置
    image_api_key: str = None
    image_base_url: str = None
    image_model: str = None
    
    # 文本生成 API 配置
    text_api_format: Literal["gemini", "openai"] = None  # API 格式
    text_model: str = None
    text_base_url: str = None  # 可选，单独的文本 API 地址
    text_api_key: str = None   # 可选，单独的文本 API 密钥
    text_thinking_level: Optional[Literal["low", "high"]] = None  # 思考深度
    
    def __post_init__(self):
        """从配置文件加载默认值"""
        config = get_config().get("api", {})
        
        # 图像生成 API 配置
        image_config = config.get("image", {})
        if self.image_api_key is None:
            self.image_api_key = image_config.get("api_key", "")
        if self.image_base_url is None:
            self.image_base_url = image_config.get("base_url", "https://magic666.top")
        if self.image_model is None:
            self.image_model = image_config.get("model", "gemini-3-pro-image-preview")
        
        # 文本生成 API 配置
        text_config = config.get("text", {})
        if self.text_api_format is None:
            self.text_api_format = text_config.get("format", "gemini")
        if self.text_model is None:
            self.text_model = text_config.get("model", "gemini-3-pro-preview")
        if self.text_base_url is None:
            self.text_base_url = text_config.get("base_url")  # 可选
        if self.text_api_key is None:
            self.text_api_key = text_config.get("api_key")  # 可选
        if self.text_thinking_level is None:
            self.text_thinking_level = text_config.get("thinking_level")  # 可选
        
        # 如果文本 API 没有单独配置，使用图像 API 的配置
        if not self.text_api_key:
            self.text_api_key = self.image_api_key
        if not self.text_base_url:
            self.text_base_url = self.image_base_url
    
    @property
    def api_key(self) -> str:
        """向后兼容：返回图像 API 密钥"""
        return self.image_api_key
    
    @property
    def base_url(self) -> str:
        """向后兼容：返回图像 API 地址"""
        return self.image_base_url


@dataclass
class PPTConfig:
    """PPT 生成配置"""
    language: str = None
    style: str = None
    target_audience: str = None
    num_pages: int = None
    aspect_ratio: Literal["16:9", "4:3", "1:1"] = None
    quality: Literal["1K", "2K", "4K"] = None
    max_concurrent: int = None
    max_retries: int = None
    retry_delay: float = None
    
    def __post_init__(self):
        """从配置文件加载默认值"""
        config = get_config().get("ppt", {})
        if self.language is None:
            self.language = config.get("language", "中文")
        if self.style is None:
            self.style = config.get("style", "现代简约商务风格")
        if self.target_audience is None:
            self.target_audience = config.get("target_audience", "专业人士")
        if self.num_pages is None:
            self.num_pages = config.get("num_pages", 10)
        if self.aspect_ratio is None:
            self.aspect_ratio = config.get("aspect_ratio", "16:9")
        if self.quality is None:
            self.quality = config.get("quality", "2K")
        if self.max_concurrent is None:
            self.max_concurrent = config.get("max_concurrent", 3)
        if self.max_retries is None:
            self.max_retries = config.get("max_retries", 3)
        if self.retry_delay is None:
            self.retry_delay = config.get("retry_delay", 2.0)
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PPTConfig':
        """从字典创建"""
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


def get_output_dir() -> str:
    """获取输出目录"""
    config = get_config().get("output", {})
    return config.get("dir", "output")


def get_doc_dir() -> Path:
    """获取文档目录"""
    config = get_config().get("doc", {})
    return Path(__file__).parent.parent / config.get("dir", "doc")


def get_sample_file() -> Path:
    """获取示例文件路径"""
    config = get_config().get("doc", {})
    doc_dir = get_doc_dir()
    return doc_dir / config.get("sample_file", "sample_paper.txt")


def load_sample_material() -> str:
    """加载示例资料"""
    sample_path = get_sample_file()
    if not sample_path.exists():
        raise FileNotFoundError(f"示例文件不存在: {sample_path}")
    
    with open(sample_path, 'r', encoding='utf-8') as f:
        return f.read()

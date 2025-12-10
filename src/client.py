"""
AI 客户端模块
封装 Gemini 和 OpenAI 格式的 API 调用
"""

from typing import Literal
from google import genai
from google.genai import types
from PIL import Image
from openai import OpenAI

from .config import APIConfig, get_timeout_config
from .prompts import PromptTemplates


class AIClient:
    """AI 客户端，封装文本和图像生成 API"""
    
    def __init__(self, config: APIConfig = None):
        self.config = config or APIConfig()
        self.timeout_config = get_timeout_config()
        
        # Gemini 客户端（用于图像生成）
        self._gemini_client = genai.Client(
            api_key=self.config.image_api_key,
            http_options={'baseUrl': self.config.image_base_url}
        )
        
        # OpenAI 格式客户端（用于文本生成，可选）
        self._openai_client = None
        if self.config.text_api_format == "openai":
            self._openai_client = OpenAI(
                api_key=self.config.text_api_key,
                base_url=self.config.text_base_url,
                timeout=self.timeout_config['text_generation']
            )
    
    def generate_text(self, prompt: str, system_instruction: str = None) -> str:
        """
        调用文本模型生成内容
        根据配置自动选择 Gemini 或 OpenAI 格式
        """
        if self.config.text_api_format == "openai":
            return self._generate_text_openai(prompt, system_instruction)
        else:
            return self._generate_text_gemini(prompt, system_instruction)
    
    def _generate_text_gemini(self, prompt: str, system_instruction: str = None) -> str:
        """使用 Gemini API 生成文本"""
        config = types.GenerateContentConfig()
        
        # 设置系统指令
        if system_instruction:
            config.system_instruction = system_instruction
        
        # 设置思考配置（仅支持 Gemini 3+ 系列）
        if self.config.text_thinking_level and self._supports_thinking(self.config.text_model):
            config.thinking_config = types.ThinkingConfig(
                thinking_level=self.config.text_thinking_level
            )
        
        response = self._gemini_client.models.generate_content(
            model=self.config.text_model,
            contents=prompt,
            config=config
        )
        return response.text
    
    def _supports_thinking(self, model_name: str) -> bool:
        """检查模型是否支持思考功能"""
        if not model_name:
            return False
        
        model_lower = model_name.lower()
        
        # 支持思考功能的模型模式
        thinking_patterns = [
            "gemini-3",           # gemini-3-xxx
            "gemini-4",           # gemini-4-xxx (未来版本)
            "gemini-5",           # gemini-5-xxx (未来版本)
        ]
        
        # 检查是否匹配支持思考的模型
        for pattern in thinking_patterns:
            if pattern in model_lower:
                return True
        
        return False
    
    def _generate_text_openai(self, prompt: str, system_instruction: str = None) -> str:
        """使用 OpenAI 格式 API 生成文本"""
        messages = []
        
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        
        messages.append({"role": "user", "content": prompt})
        
        response = self._openai_client.chat.completions.create(
            model=self.config.text_model,
            messages=messages
        )
        
        return response.choices[0].message.content
    
    def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "16:9",
        quality: str = "2K",
        output_path: str = "output.png"
    ) -> str:
        """文生图（使用 Gemini API）"""
        generation_config = self._build_image_config(aspect_ratio, quality)
        full_prompt = f"{PromptTemplates.get_image_generation_prefix()}{prompt}"
        
        # 在API调用级别控制超时，而不是任务级别
        try:
            response = self._gemini_client.models.generate_content(
                model=self.config.image_model,
                contents=[full_prompt],
                config=generation_config
            )
        except Exception as e:
            # 将API级别的超时转换为普通异常，让重试机制处理
            raise Exception(f"API调用失败: {e}")
        
        return self._save_image_from_response(response, output_path)
    
    def edit_image(
        self,
        prompt: str,
        source_image_path: str,
        aspect_ratio: str = "16:9",
        quality: str = "2K",
        output_path: str = "output.png"
    ) -> str:
        """图生图（使用 Gemini API）"""
        source_image = Image.open(source_image_path)
        generation_config = self._build_image_config(aspect_ratio, quality)
        full_prompt = f"{PromptTemplates.get_image_generation_prefix()}{prompt}"
        
        response = self._gemini_client.models.generate_content(
            model=self.config.image_model,
            contents=[full_prompt, source_image],
            config=generation_config
        )
        
        return self._save_image_from_response(response, output_path)
    
    def _build_image_config(self, aspect_ratio: str, quality: str) -> types.GenerateContentConfig:
        """构建图片生成配置"""
        generation_config = types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"])
        
        # 构建 ImageConfig 对象而不是字典，避免 Pydantic 警告
        image_config_params = {}
        if aspect_ratio:
            image_config_params["aspect_ratio"] = aspect_ratio
        if quality and quality != "auto":
            image_config_params["image_size"] = quality
        
        if image_config_params:
            generation_config.image_config = types.ImageConfig(**image_config_params)
        
        return generation_config
    
    def _save_image_from_response(self, response, output_path: str) -> str:
        """从响应中提取并保存图片"""
        for part in response.parts:
            if part.inline_data is not None:
                image = part.as_image()
                image.save(output_path)
                return output_path
        raise Exception("未能生成图片")

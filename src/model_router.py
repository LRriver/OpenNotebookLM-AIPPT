"""
Model routing facade for prompt generation, image generation, and image edits.
"""

import base64
import json
from pathlib import Path
from typing import Any, Dict, Optional

import requests
from openai import OpenAI

from .image_result import ImageResultNormalizer
from .model_profiles import ModelProfile, ModelProfileSet
from .prompts import PromptTemplates


class ModelRouter:
    def __init__(self, profiles: ModelProfileSet):
        self.profiles = profiles
        self.normalizer = ImageResultNormalizer()

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        profile = self.profiles.prompt
        if profile.adapter not in {"openai_chat", "litellm"}:
            raise ValueError(f"不支持的文本模型适配器: {profile.adapter}")

        client = OpenAI(api_key=profile.api_key, base_url=profile.base_url, timeout=120)
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        response = client.chat.completions.create(model=profile.model, messages=messages)
        if not response.choices:
            return ""
        return response.choices[0].message.content or ""

    def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "16:9",
        quality: str = "2K",
        output_path: str = "output.png",
    ) -> str:
        profile = self.profiles.image
        full_prompt = f"{PromptTemplates.get_image_generation_prefix()}{prompt}"
        payload = self._chat_image_payload(profile, full_prompt, aspect_ratio, quality)
        result = self._post_chat(profile, payload)
        return self._write_normalized_image(result, output_path)

    def edit_image(
        self,
        prompt: str,
        source_image_path: str,
        aspect_ratio: str = "16:9",
        quality: str = "2K",
        output_path: str = "output.png",
    ) -> str:
        profile = self.profiles.edit
        source = Path(source_image_path).read_bytes()
        source_b64 = base64.b64encode(source).decode()
        full_prompt = f"{PromptTemplates.get_image_generation_prefix()}{prompt}"
        payload = self._chat_image_payload(
            profile,
            full_prompt,
            aspect_ratio,
            quality,
            source_image_base64=source_b64,
        )
        result = self._post_chat(profile, payload)
        return self._write_normalized_image(result, output_path)

    def generate_image_base64(self, prompt: str, aspect_ratio: str = "16:9", quality: str = "2K") -> str:
        profile = self.profiles.image
        result = self._post_chat(profile, self._chat_image_payload(profile, prompt, aspect_ratio, quality))
        return self.normalizer.normalize(result).base64_data

    def edit_image_base64(
        self,
        image_base64: str,
        instruction: str,
        aspect_ratio: str = "16:9",
        quality: str = "2K",
    ) -> str:
        profile = self.profiles.edit
        payload = self._chat_image_payload(
            profile,
            instruction,
            aspect_ratio,
            quality,
            source_image_base64=image_base64,
        )
        return self.normalizer.normalize(self._post_chat(profile, payload)).base64_data

    def _chat_image_payload(
        self,
        profile: ModelProfile,
        prompt: str,
        aspect_ratio: str,
        quality: str,
        source_image_base64: Optional[str] = None,
    ) -> Dict[str, Any]:
        if source_image_base64:
            content: Any = [
                {
                    "type": "text",
                    "text": (
                        f"{prompt}\n\n"
                        f"输出画幅: {aspect_ratio}，质量: {quality}。"
                        "请返回修改后的图片，优先返回图片链接或 base64。"
                    ),
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{source_image_base64}"},
                },
            ]
        else:
            content = (
                f"{prompt}\n\n"
                f"输出画幅: {aspect_ratio}，质量: {quality}。"
                "请直接生成一张可用于 PPT 的图片，优先返回图片链接或 base64。"
            )

        return {
            "model": profile.model,
            "messages": [{"role": "user", "content": content}],
            "max_tokens": 2000,
        }

    def _post_chat(self, profile: ModelProfile, payload: Dict[str, Any]) -> Dict[str, Any]:
        if profile.adapter not in {"raw_chat_multimodal", "openai_chat"}:
            raise ValueError(f"不支持的图像模型适配器: {profile.adapter}")

        response = requests.post(
            f"{profile.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {profile.api_key}",
                "Content-Type": "application/json",
            },
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            timeout=180,
        )
        response.raise_for_status()
        return response.json()

    def _write_normalized_image(self, payload: Dict[str, Any], output_path: str) -> str:
        image = self.normalizer.normalize(payload)
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(base64.b64decode(image.base64_data))
        return str(path)

"""
Image result normalization utilities.

Model providers return images in several shapes: markdown links, plain URLs,
data URLs, OpenAI-style b64_json payloads, or raw base64 strings. The API layer
uses this module to normalize all of them into base64 data for frontend state,
editing history, and export.
"""

import base64
import re
from dataclasses import dataclass
from typing import Any, Callable, Optional

import requests


@dataclass
class NormalizedImage:
    base64_data: str
    mime_type: str = "image/png"
    source: str = "base64"


class ImageResultNormalizer:
    """Normalize image payloads from OpenAI-compatible and markdown responses."""

    def __init__(self, fetcher: Optional[Callable[[str], bytes]] = None):
        self.fetcher = fetcher or self._fetch_url

    def normalize(self, payload: Any) -> NormalizedImage:
        candidate = self._extract_candidate(payload)

        if not candidate:
            raise ValueError("未能从模型响应中提取图片")

        if isinstance(candidate, bytes):
            return NormalizedImage(base64.b64encode(candidate).decode(), "image/png", "bytes")

        candidate = str(candidate).strip()

        data_url = self._parse_data_url(candidate)
        if data_url:
            mime_type, data = data_url
            self._validate_base64(data)
            return NormalizedImage(data, mime_type, "base64")

        if candidate.startswith("http://") or candidate.startswith("https://"):
            image_bytes = self.fetcher(candidate)
            return NormalizedImage(
                base64.b64encode(image_bytes).decode(),
                self._guess_mime_type(candidate, image_bytes),
                "url",
            )

        if self._looks_like_base64(candidate):
            self._validate_base64(candidate)
            return NormalizedImage(candidate, "image/png", "base64")

        raise ValueError("模型响应中的图片格式不受支持")

    def _extract_candidate(self, payload: Any) -> Any:
        if payload is None:
            return None

        if isinstance(payload, (str, bytes)):
            if isinstance(payload, str):
                markdown_url = self._extract_markdown_url(payload)
                return markdown_url or payload
            return payload

        if hasattr(payload, "model_dump"):
            payload = payload.model_dump()
        elif hasattr(payload, "to_dict"):
            payload = payload.to_dict()

        if isinstance(payload, dict):
            if payload.get("b64_json"):
                return payload["b64_json"]
            if payload.get("url"):
                return payload["url"]
            if payload.get("image_base64"):
                return payload["image_base64"]

            data = payload.get("data")
            if isinstance(data, list) and data:
                return self._extract_candidate(data[0])

            choices = payload.get("choices")
            if isinstance(choices, list) and choices:
                message = choices[0].get("message", {}) if isinstance(choices[0], dict) else {}
                content = message.get("content")
                if content:
                    return self._extract_candidate(content)

        return None

    @staticmethod
    def _extract_markdown_url(text: str) -> Optional[str]:
        match = re.search(r"!\[[^\]]*]\((https?://[^)]+)\)", text)
        if match:
            return match.group(1)
        return None

    @staticmethod
    def _parse_data_url(text: str) -> Optional[tuple[str, str]]:
        match = re.match(r"^data:(image/[^;]+);base64,(.+)$", text, re.DOTALL)
        if not match:
            return None
        return match.group(1), match.group(2).strip()

    @staticmethod
    def _looks_like_base64(text: str) -> bool:
        compact = re.sub(r"\s+", "", text)
        if len(compact) < 8 or len(compact) % 4 != 0:
            return False
        return bool(re.fullmatch(r"[A-Za-z0-9+/]+={0,2}", compact))

    @staticmethod
    def _validate_base64(data: str) -> None:
        base64.b64decode(data, validate=True)

    @staticmethod
    def _guess_mime_type(url: str, image_bytes: bytes) -> str:
        lowered = url.lower().split("?", 1)[0]
        if lowered.endswith(".jpg") or lowered.endswith(".jpeg"):
            return "image/jpeg"
        if lowered.endswith(".webp"):
            return "image/webp"
        if image_bytes.startswith(b"\xff\xd8"):
            return "image/jpeg"
        if image_bytes.startswith(b"RIFF") and b"WEBP" in image_bytes[:16]:
            return "image/webp"
        return "image/png"

    @staticmethod
    def _fetch_url(url: str) -> bytes:
        response = requests.get(url, timeout=120)
        response.raise_for_status()
        return response.content

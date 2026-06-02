"""
Helpers for resolving model profiles from API requests.
"""

from typing import Any, Dict, Optional

from src.model_profiles import ModelProfileSet, load_default_profiles, resolve_model_profiles


def _has_value(value: Optional[str]) -> bool:
    return bool(value and value not in {"SET", "EMPTY"})


def _has_complete_generation_profiles(config: Any) -> bool:
    profiles = getattr(config, "model_profiles", None)
    if not profiles:
        return False
    required = (profiles.prompt_model, profiles.image_model)
    return all(
        _has_value(profile.model) and _has_value(profile.base_url) and _has_value(profile.api_key)
        for profile in required
    )


def _has_complete_legacy_profiles(config: Any) -> bool:
    return bool(
        getattr(config, "text", None)
        and getattr(config, "image", None)
        and _has_value(config.text.model)
        and _has_value(config.text.base_url)
        and _has_value(config.text.api_key)
        and _has_value(config.image.model)
        and _has_value(config.image.base_url)
        and _has_value(config.image.api_key)
    )


def profiles_from_generation_config(config: Any) -> ModelProfileSet:
    if _has_complete_generation_profiles(config):
        return resolve_model_profiles(config.model_profiles.model_dump())

    if _has_complete_legacy_profiles(config):
        data: Dict[str, Any] = {
            "prompt_model": {
                "model": config.text.model,
                "base_url": config.text.base_url,
                "api_key": config.text.api_key,
                "adapter": "openai_chat",
                "thinking": getattr(config.text, "thinking", "disabled"),
            },
            "image_model": {
                "model": config.image.model,
                "base_url": config.image.base_url,
                "api_key": config.image.api_key,
                "adapter": "raw_chat_multimodal",
            },
        }
        return resolve_model_profiles(data)

    default_profiles = load_default_profiles()
    if default_profiles:
        return default_profiles

    api_key = config.get_image_api_key()
    base_url = config.get_image_base_url()
    if not api_key or not base_url:
        raise ValueError("未配置可用模型，请先配置后端 profile 或在请求中提供模型配置")

    return resolve_model_profiles(
        {
            "prompt_model": {
                "model": config.get_text_model(),
                "base_url": config.get_text_base_url(),
                "api_key": config.get_text_api_key(),
                "adapter": "openai_chat",
                "thinking": config.get_thinking(),
            },
            "image_model": {
                "model": config.get_image_model(),
                "base_url": base_url,
                "api_key": api_key,
                "adapter": "raw_chat_multimodal",
            },
        }
    )


def profiles_from_edit_config(config: Any) -> ModelProfileSet:
    if _has_complete_generation_profiles(config):
        return resolve_model_profiles(config.model_profiles.model_dump())

    default_profiles = load_default_profiles()
    if default_profiles:
        return default_profiles

    if not getattr(config, "api_key", None) or not getattr(config, "base_url", None):
        raise ValueError("未配置可用编辑模型，请先配置后端 profile 或在请求中提供编辑模型配置")

    return resolve_model_profiles(
        {
            "prompt_model": {
                "model": config.model,
                "base_url": config.base_url,
                "api_key": config.api_key,
                "adapter": "openai_chat",
            },
            "image_model": {
                "model": config.model,
                "base_url": config.base_url,
                "api_key": config.api_key,
                "adapter": "raw_chat_multimodal",
            },
        }
    )

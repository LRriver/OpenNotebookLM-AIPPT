"""
Helpers for updating local config.yaml from the workbench.
"""

from pathlib import Path
from typing import Any, Dict

import yaml

from .config import CONFIG_FILE, load_yaml_config, reload_config


def save_model_profiles_to_config(profile_data: Dict[str, Any], config_path: Path = CONFIG_FILE) -> Dict[str, Any]:
    config = load_yaml_config()
    config.setdefault("api", {})
    existing_models = config.get("api", {}).get("models", {})
    config["api"]["models"] = _clean_profile_data(profile_data, existing_models)

    config_path.write_text(
        yaml.safe_dump(config, allow_unicode=True, sort_keys=False),
        encoding="utf-8",
    )
    reload_config()
    return config


def _clean_profile_data(profile_data: Dict[str, Any], existing_models: Dict[str, Any]) -> Dict[str, Any]:
    cleaned: Dict[str, Any] = {}
    for role in ("prompt_model", "image_model", "edit_model"):
        profile = profile_data.get(role)
        if not profile:
            continue
        existing_profile = existing_models.get(role, {}) if isinstance(existing_models, dict) else {}
        api_key = profile.get("api_key") or existing_profile.get("api_key", "")
        cleaned[role] = {
            "model": profile.get("model", ""),
            "base_url": profile.get("base_url", ""),
            "api_key": api_key,
            "adapter": profile.get("adapter", "openai_chat" if role == "prompt_model" else "raw_chat_multimodal"),
        }
        if profile.get("id"):
            cleaned[role]["id"] = profile["id"]
        if profile.get("label"):
            cleaned[role]["label"] = profile["label"]
    return cleaned

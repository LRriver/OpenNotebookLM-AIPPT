"""
Model profile resolution for the PPT workbench.

The application treats prompt generation, image generation, and image editing
as separate model roles. Edit defaults to image because many providers use the
same model for both tasks.
"""

import os
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, Optional


DEFAULT_ADAPTERS = {
    "prompt": "openai_chat",
    "image": "raw_chat_multimodal",
    "edit": "raw_chat_multimodal",
}


@dataclass
class ModelProfile:
    role: str
    model: str
    base_url: str
    api_key: str
    adapter: str = ""
    id: str = ""
    label: str = ""

    def __post_init__(self):
        if self.base_url:
            self.base_url = self.base_url.rstrip("/")
            if not self.base_url.endswith("/v1"):
                self.base_url += "/v1"
        if not self.adapter:
            self.adapter = DEFAULT_ADAPTERS.get(self.role, "openai_chat")
        if not self.id:
            self.id = self.role
        if not self.label:
            self.label = self.model

    def to_public_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["api_key"] = "SET" if self.api_key else "EMPTY"
        return data


@dataclass
class ModelProfileSet:
    prompt: ModelProfile
    image: ModelProfile
    edit: ModelProfile

    def to_public_dict(self) -> Dict[str, Any]:
        return {
            "prompt_model": self.prompt.to_public_dict(),
            "image_model": self.image.to_public_dict(),
            "edit_model": self.edit.to_public_dict(),
        }


def resolve_model_profiles(data: Dict[str, Any]) -> ModelProfileSet:
    prompt = _profile_from_dict("prompt", data.get("prompt_model") or data.get("text") or {})
    image = _profile_from_dict("image", data.get("image_model") or data.get("image") or {})

    edit_source = data.get("edit_model") or data.get("edit")
    edit = _profile_from_dict("edit", edit_source) if edit_source else _inherit_edit_profile(image)

    return ModelProfileSet(prompt=prompt, image=image, edit=edit)


def load_profiles_from_env(env_path: Optional[Path] = None) -> Optional[ModelProfileSet]:
    configured_path = env_path or os.environ.get("AIPPT_ENV_FILE")
    if not configured_path:
        return None
    path = Path(configured_path)
    if not path.exists():
        return None

    raw = _parse_env_like_file(path)
    if not raw:
        return None

    text_model = raw.get("text_model_name") or raw.get("_model_name")
    text_url = raw.get("text_model_url") or raw.get("_model_url")
    text_key = raw.get("text_model_api_key") or raw.get("_model_api_key")

    image_model = raw.get("image_gen_model_name")
    image_url = raw.get("image_gen_model_url")
    image_key = raw.get("image_gen_model_api_key")

    edit_model = raw.get("image_edit_model_name") or image_model
    edit_url = raw.get("image_edit_model_url") or image_url
    edit_key = raw.get("image_edit_model_api_key") or image_key

    if not (text_model and text_url and text_key and image_model and image_url and image_key):
        return None

    return resolve_model_profiles(
        {
            "prompt_model": {
                "id": "env-text",
                "label": text_model,
                "model": text_model,
                "base_url": text_url,
                "api_key": text_key,
                "adapter": "openai_chat",
            },
            "image_model": {
                "id": "env-image",
                "label": image_model,
                "model": image_model,
                "base_url": image_url,
                "api_key": image_key,
                "adapter": "raw_chat_multimodal",
            },
            "edit_model": {
                "id": "env-edit",
                "label": edit_model,
                "model": edit_model,
                "base_url": edit_url,
                "api_key": edit_key,
                "adapter": "raw_chat_multimodal",
            },
        }
    )


def load_default_profiles(config_data: Optional[Dict[str, Any]] = None) -> Optional[ModelProfileSet]:
    """Load profiles from the repository-local config.yaml data."""
    if config_data is None:
        try:
            from .config import get_config

            config_data = get_config()
        except Exception:
            config_data = {}

    api_config = (config_data or {}).get("api", {})
    profile_data = api_config.get("models") or {}
    if profile_data:
        return resolve_model_profiles(profile_data)

    if api_config.get("text") or api_config.get("image"):
        legacy = {
            "prompt_model": {
                **(api_config.get("text") or {}),
                "adapter": (api_config.get("text") or {}).get("adapter", "openai_chat"),
            },
            "image_model": {
                **(api_config.get("image") or {}),
                "adapter": (api_config.get("image") or {}).get("adapter", "raw_chat_multimodal"),
            },
        }
        if api_config.get("edit"):
            legacy["edit_model"] = {
                **api_config["edit"],
                "adapter": api_config["edit"].get("adapter", "raw_chat_multimodal"),
            }
        try:
            return resolve_model_profiles(legacy)
        except ValueError:
            pass

    return None


def _inherit_edit_profile(image: ModelProfile) -> ModelProfile:
    return ModelProfile(
        role="edit",
        id="edit",
        label=image.label,
        model=image.model,
        base_url=image.base_url,
        api_key=image.api_key,
        adapter=image.adapter,
    )


def _profile_from_dict(role: str, data: Dict[str, Any]) -> ModelProfile:
    model = data.get("model") or data.get("model_name")
    base_url = data.get("base_url") or data.get("url")
    api_key = data.get("api_key") or data.get("key")

    if not model or not base_url or api_key is None:
        raise ValueError(f"{role} model profile is incomplete")

    return ModelProfile(
        role=role,
        id=data.get("id", role),
        label=data.get("label", model),
        model=model,
        base_url=base_url,
        api_key=api_key,
        adapter=data.get("adapter", DEFAULT_ADAPTERS.get(role, "openai_chat")),
    )


def _parse_env_like_file(path: Path) -> Dict[str, str]:
    replacements = str.maketrans({"“": '"', "”": '"', "‘": "'", "’": "'"})
    values: Dict[str, str] = {}
    for raw_line in path.read_text(errors="replace").splitlines():
        line = raw_line.strip().translate(replacements)
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export "):].strip()
        if "=" in line:
            key, value = line.split("=", 1)
        elif ":" in line:
            key, value = line.split(":", 1)
        else:
            continue
        key = key.strip()
        value = value.strip().strip("\"'")
        values[key] = value
    return values

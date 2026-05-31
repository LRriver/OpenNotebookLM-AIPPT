"""
模型 profile 路由
"""

from fastapi import APIRouter, HTTPException

from src.config_writer import save_model_profiles_to_config
from src.model_profiles import load_default_profiles
from src.model_profiles import resolve_model_profiles
from ..models import ModelProfilesConfig, ModelProfilesResponse

router = APIRouter(prefix="/api", tags=["models"])


@router.get("/model-profiles", response_model=ModelProfilesResponse)
async def get_model_profiles():
    profiles = load_default_profiles()
    if not profiles:
        return ModelProfilesResponse(
            success=False,
            profiles=None,
            message="未找到后端模型配置",
        )
    return ModelProfilesResponse(success=True, profiles=profiles.to_public_dict())


@router.put("/model-profiles", response_model=ModelProfilesResponse)
async def update_model_profiles(config: ModelProfilesConfig):
    try:
        profile_data = config.model_dump()
        save_model_profiles_to_config(profile_data)
        profiles = resolve_model_profiles(profile_data)
        return ModelProfilesResponse(
            success=True,
            profiles=profiles.to_public_dict(),
            message="模型配置已保存到本地 config.yaml",
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"保存模型配置失败: {exc}")

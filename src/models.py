"""
数据模型模块
定义数据结构
"""

import json
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from pydantic import BaseModel, Field


@dataclass
class SlidePrompt:
    """单页 PPT 的 Prompt"""
    page: int
    title: str
    content_summary: str
    prompt: str
    display_content: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SlidePrompt':
        return cls(**data)


class SlideOutline(BaseModel):
    """用户可审阅的单页设计大纲"""
    page: int = Field(..., ge=1)
    title: str = Field(..., min_length=1)
    narrative_goal: str = Field(..., min_length=1)
    key_points: List[str] = Field(default_factory=list)
    visual_direction: str = Field(..., min_length=1)


class DeckOutline(BaseModel):
    """整套 PPT 的设计大纲"""
    title: str = Field(..., min_length=1)
    user_requirements: str = Field("", description="已吸收的用户定制需求")
    design_style: str = Field(..., min_length=1)
    audience: str = Field(..., min_length=1)
    slides: List[SlideOutline] = Field(default_factory=list)


class SlidePromptPlan(BaseModel):
    """用户可确认的单页设计和内部图像 prompt"""
    page: int = Field(..., ge=1)
    title: str = Field(..., min_length=1)
    content_summary: str = Field(..., min_length=1)
    display_content: str = Field(..., min_length=1)
    prompt: str = Field(..., min_length=1)


class SlidePromptPlanSet(BaseModel):
    """逐页设计和 prompt 结构化结果"""
    slide_prompts: List[SlidePromptPlan] = Field(default_factory=list)


@dataclass
class PromptData:
    """所有 Prompt 数据"""
    slide_prompts: List[SlidePrompt] = field(default_factory=list)
    created_at: str = ""
    config: Dict[str, Any] = field(default_factory=dict)
    
    # 保存原始输入，用于后续检查
    source_material: str = ""
    user_requirements: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "slide_prompts": [s.to_dict() if isinstance(s, SlidePrompt) else s for s in self.slide_prompts],
            "created_at": self.created_at,
            "config": self.config,
            "source_material": self.source_material,
            "user_requirements": self.user_requirements
        }
    
    def save(self, filepath: str):
        """保存到 JSON 文件"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, ensure_ascii=False, indent=2)
        print(f"✅ Prompt 数据已保存到: {filepath}")
    
    @classmethod
    def load(cls, filepath: str) -> 'PromptData':
        """从 JSON 文件加载"""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        slide_prompts = [
            SlidePrompt.from_dict(s) if isinstance(s, dict) else s 
            for s in data.get("slide_prompts", [])
        ]
        
        return cls(
            slide_prompts=slide_prompts,
            created_at=data.get("created_at", ""),
            config=data.get("config", {}),
            source_material=data.get("source_material", ""),
            user_requirements=data.get("user_requirements", "")
        )


@dataclass
class GenerationResult:
    """生成结果"""
    project_dir: str
    slide_image_paths: List[str] = field(default_factory=list)
    prompt_data: Optional[PromptData] = None
    created_at: str = ""
    success: bool = True
    error_message: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "project_dir": self.project_dir,
            "slide_image_paths": self.slide_image_paths,
            "created_at": self.created_at,
            "success": self.success,
            "error_message": self.error_message
        }
    
    def save(self, filepath: str):
        """保存结果到 JSON"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, ensure_ascii=False, indent=2)

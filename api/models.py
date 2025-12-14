"""
Pydantic 请求/响应模型定义
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


# ============ 上传相关模型 ============

class UploadResponse(BaseModel):
    """文件上传响应"""
    success: bool
    content: str
    filename: str
    message: Optional[str] = None


# ============ 生成相关模型 ============

class GenerationConfig(BaseModel):
    """生成配置"""
    api_key: str = Field(..., description="API 密钥")
    base_url: str = Field(..., description="API 基础 URL")
    page_count: int = Field(10, ge=1, le=20, description="页数，范围 1-20")
    quality: Literal["1K", "2K", "4K"] = Field("1K", description="图片质量")
    aspect_ratio: Literal["16:9", "4:3"] = Field("16:9", description="图片比例")


class GenerationRequest(BaseModel):
    """生成请求"""
    content: str = Field(..., description="Markdown 内容")
    config: GenerationConfig


class SlideData(BaseModel):
    """单页幻灯片数据"""
    id: str
    page_number: int
    image_base64: str
    prompt: str


class GenerationProgressEvent(BaseModel):
    """生成进度事件"""
    type: Literal["progress"]
    data: dict


class GenerationSlideEvent(BaseModel):
    """生成幻灯片事件"""
    type: Literal["slide"]
    data: SlideData


class GenerationCompleteEvent(BaseModel):
    """生成完成事件"""
    type: Literal["complete"]
    data: dict


class GenerationErrorEvent(BaseModel):
    """生成错误事件"""
    type: Literal["error"]
    data: dict


# ============ 编辑相关模型 ============

class EditConfig(BaseModel):
    """编辑配置"""
    api_key: str = Field(..., description="API 密钥")
    base_url: str = Field(..., description="API 基础 URL")
    quality: Literal["1K", "2K", "4K"] = Field("1K", description="图片质量")
    aspect_ratio: Literal["16:9", "4:3"] = Field("16:9", description="图片比例")


class EditRequest(BaseModel):
    """编辑请求"""
    image_base64: str = Field(..., description="原始图片 Base64")
    instruction: str = Field(..., description="修改指令")
    config: EditConfig


class EditResponse(BaseModel):
    """编辑响应"""
    success: bool
    image_base64: Optional[str] = None
    message: Optional[str] = None


# ============ 导出相关模型 ============

class ExportSlide(BaseModel):
    """导出的幻灯片"""
    image_base64: str


class ExportRequest(BaseModel):
    """导出请求"""
    slides: List[ExportSlide]
    format: Literal["pdf", "pptx"] = Field(..., description="导出格式")


class ExportResponse(BaseModel):
    """导出响应"""
    success: bool
    message: Optional[str] = None

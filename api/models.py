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
    file_size: Optional[int] = None
    message: Optional[str] = None


# ============ 生成相关模型 ============

class ImageApiConfig(BaseModel):
    """图像模型 API 配置"""
    api_key: str = Field(..., description="图像模型 API 密钥")
    base_url: str = Field(..., description="图像模型 API 基础 URL")
    model: str = Field("gemini-3-pro-image-preview", description="图像模型名称")


class TextApiConfig(BaseModel):
    """文本模型 API 配置"""
    api_key: str = Field(..., description="文本模型 API 密钥")
    base_url: str = Field(..., description="文本模型 API 基础 URL")
    model: str = Field("gemini-3-pro-preview", description="文本模型名称")
    format: Literal["gemini", "openai"] = Field("gemini", description="API 格式")
    thinking_level: Optional[Literal["low", "high"]] = Field(None, description="思考深度")


class GenerationConfig(BaseModel):
    """生成配置（完整版）"""
    # 图像模型配置
    image: Optional[ImageApiConfig] = Field(None, description="图像模型配置")
    # 文本模型配置
    text: Optional[TextApiConfig] = Field(None, description="文本模型配置")
    # 向后兼容的简单配置
    api_key: Optional[str] = Field(None, description="API 密钥（向后兼容）")
    base_url: Optional[str] = Field(None, description="API 基础 URL（向后兼容）")
    # 生成参数
    page_count: int = Field(10, ge=1, le=20, description="页数，范围 1-20")
    quality: Literal["1K", "2K", "4K"] = Field("1K", description="图片质量")
    aspect_ratio: Literal["16:9", "4:3"] = Field("16:9", description="图片比例")
    # PPT 内容配置
    language: str = Field("中文", description="输出语言")
    style: str = Field("现代简约商务风格", description="PPT 风格")
    target_audience: str = Field("专业人士", description="目标受众")
    
    def get_image_api_key(self) -> str:
        """获取图像模型 API 密钥"""
        if self.image:
            return self.image.api_key
        return self.api_key or ""
    
    def get_image_base_url(self) -> str:
        """获取图像模型 API 基础 URL"""
        if self.image:
            return self.image.base_url
        return self.base_url or ""
    
    def get_image_model(self) -> str:
        """获取图像模型名称"""
        if self.image:
            return self.image.model
        return "gemini-3-pro-image-preview"
    
    def get_text_api_key(self) -> str:
        """获取文本模型 API 密钥"""
        if self.text:
            return self.text.api_key
        return self.api_key or ""
    
    def get_text_base_url(self) -> str:
        """获取文本模型 API 基础 URL"""
        if self.text:
            return self.text.base_url
        return self.base_url or ""
    
    def get_text_model(self) -> str:
        """获取文本模型名称"""
        if self.text:
            return self.text.model
        return "gemini-3-pro-preview"
    
    def get_text_format(self) -> str:
        """获取文本 API 格式"""
        if self.text:
            return self.text.format
        return "gemini"
    
    def get_thinking_level(self) -> Optional[str]:
        """获取思考深度"""
        if self.text:
            return self.text.thinking_level
        return None


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

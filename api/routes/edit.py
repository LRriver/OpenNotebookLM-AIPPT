"""
图生图编辑路由
"""

import sys
import base64
import tempfile
from pathlib import Path
from fastapi import APIRouter, HTTPException

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from src.config import APIConfig
from src.client import AIClient
from ..models import EditRequest, EditResponse

router = APIRouter(prefix="/api", tags=["edit"])


@router.post("/edit", response_model=EditResponse)
async def edit_image(request: EditRequest):
    """
    图生图编辑
    
    Args:
        request: 编辑请求，包含原始图片和修改指令
        
    Returns:
        EditResponse: 包含编辑后的图片
    """
    try:
        # 配置 API
        api_config = APIConfig()
        api_config.image_api_key = request.config.api_key
        api_config.image_base_url = request.config.base_url
        
        # 创建 AI 客户端
        client = AIClient(api_config)
        
        # 解码 base64 图片并保存到临时文件
        image_data = base64.b64decode(request.image_base64)
        
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_input:
            temp_input.write(image_data)
            temp_input_path = temp_input.name
        
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_output:
            temp_output_path = temp_output.name
        
        try:
            # 调用图生图 API
            output_path = client.edit_image(
                prompt=request.instruction,
                source_image_path=temp_input_path,
                aspect_ratio=request.config.aspect_ratio,
                quality=request.config.quality,
                output_path=temp_output_path
            )
            
            # 读取生成的图片并转换为 base64
            with open(output_path, 'rb') as f:
                output_image_data = f.read()
                output_image_base64 = base64.b64encode(output_image_data).decode('utf-8')
            
            return EditResponse(
                success=True,
                image_base64=output_image_base64,
                message="编辑成功"
            )
        
        finally:
            # 清理临时文件
            Path(temp_input_path).unlink(missing_ok=True)
            Path(temp_output_path).unlink(missing_ok=True)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"编辑失败: {str(e)}"
        )

"""
文件上传路由
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from ..models import UploadResponse

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    上传 Markdown 文件
    
    Args:
        file: 上传的文件
        
    Returns:
        UploadResponse: 包含文件内容和文件名
    """
    # 验证文件类型
    if not file.filename.endswith('.md'):
        raise HTTPException(
            status_code=400,
            detail="仅支持 .md 文件"
        )
    
    try:
        # 读取文件内容
        content = await file.read()
        content_str = content.decode('utf-8')
        
        return UploadResponse(
            success=True,
            content=content_str,
            filename=file.filename,
            message="文件上传成功"
        )
    
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="文件编码错误，请确保文件为 UTF-8 编码"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"文件上传失败: {str(e)}"
        )

"""
文件上传路由

Requirements: 2.1, 2.2
- 接收 multipart/form-data
- 验证文件类型（仅 .md）
- 返回文件内容
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from ..models import UploadResponse

router = APIRouter(prefix="/api", tags=["upload"])

# 最大文件大小限制 (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024


def validate_markdown_file(filename: str) -> bool:
    """
    验证文件是否为 Markdown 文件
    
    Property 1: File Upload Validation
    For any uploaded file, if the file extension is not .md, 
    the system should reject it.
    
    Args:
        filename: 文件名
        
    Returns:
        bool: 是否为有效的 Markdown 文件
    """
    if not filename:
        return False
    return filename.lower().endswith('.md')


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    上传 Markdown 文件
    
    接收 multipart/form-data 格式的文件上传请求，
    验证文件类型并返回文件内容。
    
    Args:
        file: 上传的文件 (multipart/form-data)
        
    Returns:
        UploadResponse: 包含文件内容、文件名和文件大小
        
    Raises:
        HTTPException 400: 文件类型无效或编码错误
        HTTPException 413: 文件大小超过限制
        HTTPException 500: 服务器内部错误
    """
    # 验证文件类型
    if not validate_markdown_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail="仅支持 .md 文件格式"
        )
    
    try:
        # 读取文件内容
        content = await file.read()
        
        # 验证文件大小
        file_size = len(content)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"文件大小超过限制 (最大 {MAX_FILE_SIZE // 1024 // 1024}MB)"
            )
        
        # 解码文件内容
        content_str = content.decode('utf-8')
        
        return UploadResponse(
            success=True,
            content=content_str,
            filename=file.filename,
            file_size=file_size,
            message="文件上传成功"
        )
    
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="文件编码错误，请确保文件为 UTF-8 编码"
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"文件上传失败: {str(e)}"
        )

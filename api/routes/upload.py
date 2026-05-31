"""
文件上传路由

Requirements: 2.1, 2.2
- 接收 multipart/form-data
- 验证文件类型（仅 .md）
- 返回文件内容
"""

import tempfile
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException
from ..models import UploadResponse
from src.document_parser import DocumentParser

router = APIRouter(prefix="/api", tags=["upload"])

# 最大文件大小限制 (10MB)
MAX_FILE_SIZE = 50 * 1024 * 1024
SUPPORTED_EXTENSIONS = {".md", ".markdown", ".txt", ".pdf", ".docx", ".pptx"}


def validate_supported_file(filename: str) -> bool:
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
    return Path(filename).suffix.lower() in SUPPORTED_EXTENSIONS


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
    if not validate_supported_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail="仅支持 .md/.txt/.pdf/.docx/.pptx 文件格式"
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
        
        suffix = Path(file.filename).suffix.lower()
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
            temp_file.write(content)
            temp_path = Path(temp_file.name)

        try:
            content_str = DocumentParser().parse(temp_path).normalized_markdown
        finally:
            temp_path.unlink(missing_ok=True)
        
        return UploadResponse(
            success=True,
            content=content_str,
            filename=file.filename,
            file_size=file_size,
            message="文件上传并解析成功"
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

"""
PPT 生成路由
"""

import sys
import json
import base64
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from src.config import APIConfig, PPTConfig
from src.generator import PPTGenerator
from ..models import GenerationRequest

router = APIRouter(prefix="/api", tags=["generate"])


async def generate_stream(request: GenerationRequest) -> AsyncGenerator[str, None]:
    """
    生成 PPT 的流式响应
    
    使用 Server-Sent Events (SSE) 格式返回进度和结果
    """
    try:
        # 配置 API
        api_config = APIConfig()
        api_config.image_api_key = request.config.api_key
        api_config.image_base_url = request.config.base_url
        api_config.text_api_key = request.config.api_key
        api_config.text_base_url = request.config.base_url
        
        # 配置 PPT
        ppt_config = PPTConfig()
        ppt_config.num_pages = request.config.page_count
        ppt_config.quality = request.config.quality
        ppt_config.aspect_ratio = request.config.aspect_ratio
        
        # 创建生成器
        generator = PPTGenerator(api_config=api_config)
        
        # 发送开始事件
        yield f"data: {json.dumps({'type': 'progress', 'data': {'status': 'started', 'message': '开始生成 PPT'}})}\n\n"
        
        # 生成 Prompt
        yield f"data: {json.dumps({'type': 'progress', 'data': {'status': 'generating_prompts', 'message': '正在生成 Prompt'}})}\n\n"
        
        prompt_data = generator.prompt_generator.generate(request.content, ppt_config)
        
        # 生成图片
        yield f"data: {json.dumps({'type': 'progress', 'data': {'status': 'generating_images', 'message': '正在生成图片', 'total': len(prompt_data.slide_prompts)}})}\n\n"
        
        # 逐页生成并发送
        for idx, slide_prompt in enumerate(prompt_data.slide_prompts):
            try:
                # 生成单页图片
                temp_output = f"/tmp/slide_{idx + 1}.png"
                image_path = generator.image_generator.generate_single_slide(
                    slide_prompt=slide_prompt,
                    output_path=temp_output,
                    config=ppt_config
                )
                
                # 读取图片并转换为 base64
                with open(image_path, 'rb') as f:
                    image_data = f.read()
                    image_base64 = base64.b64encode(image_data).decode('utf-8')
                
                # 发送幻灯片事件
                slide_data = {
                    'type': 'slide',
                    'data': {
                        'id': f"slide_{idx + 1}",
                        'page_number': idx + 1,
                        'image_base64': image_base64,
                        'prompt': slide_prompt
                    }
                }
                yield f"data: {json.dumps(slide_data)}\n\n"
                
                # 发送进度更新
                progress_data = {
                    'type': 'progress',
                    'data': {
                        'status': 'generating_images',
                        'current': idx + 1,
                        'total': len(prompt_data.slide_prompts),
                        'message': f'已生成 {idx + 1}/{len(prompt_data.slide_prompts)} 页'
                    }
                }
                yield f"data: {json.dumps(progress_data)}\n\n"
                
            except Exception as e:
                # 发送错误事件但继续生成其他页面
                error_data = {
                    'type': 'error',
                    'data': {
                        'page': idx + 1,
                        'message': f'第 {idx + 1} 页生成失败: {str(e)}'
                    }
                }
                yield f"data: {json.dumps(error_data)}\n\n"
        
        # 发送完成事件
        complete_data = {
            'type': 'complete',
            'data': {
                'status': 'completed',
                'message': 'PPT 生成完成'
            }
        }
        yield f"data: {json.dumps(complete_data)}\n\n"
    
    except Exception as e:
        # 发送致命错误事件
        error_data = {
            'type': 'error',
            'data': {
                'fatal': True,
                'message': f'生成失败: {str(e)}'
            }
        }
        yield f"data: {json.dumps(error_data)}\n\n"


@router.post("/generate")
async def generate_ppt(request: GenerationRequest):
    """
    生成 PPT
    
    使用 Server-Sent Events (SSE) 流式返回生成进度和结果
    
    Args:
        request: 生成请求，包含内容和配置
        
    Returns:
        StreamingResponse: SSE 流
    """
    return StreamingResponse(
        generate_stream(request),
        media_type="text/event-stream"
    )

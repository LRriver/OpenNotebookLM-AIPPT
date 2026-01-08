"""
PPT 生成路由
"""

import sys
import json
import base64
import asyncio
import tempfile
import time
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from src.config import APIConfig, PPTConfig
from src.client import AIClient
from src.prompt_generator import PromptGenerator
from ..models import GenerationRequest

router = APIRouter(prefix="/api", tags=["generate"])


def generate_single_slide_sync(
    client: AIClient,
    slide_prompt,
    output_path: str,
    config: PPTConfig,
    max_retries: int = 3,
    retry_delay: float = 2.0
) -> str:
    """
    同步生成单页幻灯片图片
    
    Args:
        client: AI 客户端
        slide_prompt: 幻灯片 prompt 对象
        output_path: 输出路径
        config: PPT 配置
        max_retries: 最大重试次数
        retry_delay: 重试延迟（秒）
        
    Returns:
        生成的图片路径
    """
    for attempt in range(max_retries):
        try:
            client.generate_image(
                prompt=slide_prompt.prompt,
                aspect_ratio=config.aspect_ratio,
                quality=config.quality,
                output_path=output_path
            )
            return output_path
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
            else:
                raise e


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
        
        # 创建客户端和 Prompt 生成器
        client = AIClient(api_config)
        prompt_generator = PromptGenerator(client)
        
        # 发送开始事件
        yield f"data: {json.dumps({'type': 'progress', 'data': {'status': 'started', 'current': 0, 'total': 0, 'message': '开始生成 PPT'}})}\n\n"
        
        # 生成 Prompt
        yield f"data: {json.dumps({'type': 'progress', 'data': {'status': 'generating_prompts', 'current': 0, 'total': 0, 'message': '正在生成 Prompt...'}})}\n\n"
        
        # 在线程池中运行同步的 prompt 生成
        loop = asyncio.get_event_loop()
        prompt_data = await loop.run_in_executor(
            None,
            prompt_generator.generate,
            request.content,
            ppt_config
        )
        
        total_slides = len(prompt_data.slide_prompts)
        
        # 发送 Prompt 生成完成事件
        yield f"data: {json.dumps({'type': 'progress', 'data': {'status': 'prompts_ready', 'current': 0, 'total': total_slides, 'message': f'Prompt 生成完成，开始生成 {total_slides} 页图片'}})}\n\n"
        
        # 创建临时目录
        with tempfile.TemporaryDirectory() as temp_dir:
            # 逐页生成并发送
            for idx, slide_prompt in enumerate(prompt_data.slide_prompts):
                page_num = idx + 1
                
                # 发送当前页开始生成的进度
                yield f"data: {json.dumps({'type': 'progress', 'data': {'status': 'generating_images', 'current': idx, 'total': total_slides, 'message': f'正在生成第 {page_num}/{total_slides} 页...'}})}\n\n"
                
                try:
                    # 生成单页图片
                    temp_output = f"{temp_dir}/slide_{page_num}.png"
                    
                    # 在线程池中运行同步的图片生成
                    await loop.run_in_executor(
                        None,
                        generate_single_slide_sync,
                        client,
                        slide_prompt,
                        temp_output,
                        ppt_config
                    )
                    
                    # 读取图片并转换为 base64
                    with open(temp_output, 'rb') as f:
                        image_data = f.read()
                        image_base64 = base64.b64encode(image_data).decode('utf-8')
                    
                    # 发送幻灯片事件
                    slide_data = {
                        'type': 'slide',
                        'data': {
                            'id': f"slide_{page_num}",
                            'page_number': page_num,
                            'image_base64': image_base64,
                            'prompt': slide_prompt.prompt if hasattr(slide_prompt, 'prompt') else str(slide_prompt)
                        }
                    }
                    yield f"data: {json.dumps(slide_data)}\n\n"
                    
                    # 发送进度更新
                    progress_data = {
                        'type': 'progress',
                        'data': {
                            'status': 'generating_images',
                            'current': page_num,
                            'total': total_slides,
                            'message': f'已生成 {page_num}/{total_slides} 页'
                        }
                    }
                    yield f"data: {json.dumps(progress_data)}\n\n"
                    
                except Exception as e:
                    # 发送错误事件但继续生成其他页面
                    error_data = {
                        'type': 'error',
                        'data': {
                            'fatal': False,
                            'page': page_num,
                            'message': f'第 {page_num} 页生成失败: {str(e)}'
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
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

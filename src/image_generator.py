"""
图片生成模块
负责并行生成 PPT 页面图片
"""

import time
from pathlib import Path
from typing import List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed

from .client import AIClient
from .config import PPTConfig
from .models import PromptData, SlidePrompt


class ImageGenerator:
    """图片生成器"""
    
    def __init__(self, client: AIClient):
        """
        初始化
        
        Args:
            client: AI 客户端
        """
        self.client = client
    
    def generate_slides(
        self,
        slide_prompts: List[SlidePrompt],
        output_dir: str,
        config: PPTConfig
    ) -> List[str]:
        """
        并行生成所有 PPT 页面图片（文生图）
        
        Args:
            slide_prompts: 每页的 Prompt 列表
            output_dir: 输出目录
            config: PPT 配置
            
        Returns:
            生成的图片路径列表（按顺序）
        """
        print(f"🎨 开始并行生成 {len(slide_prompts)} 页 PPT...")
        print(f"   并发数: {config.max_concurrent}, 重试次数: {config.max_retries}")
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # 结果列表，保持顺序
        results = [None] * len(slide_prompts)
        
        # 使用线程池并行生成
        with ThreadPoolExecutor(max_workers=config.max_concurrent) as executor:
            futures = {}
            
            for i, slide in enumerate(slide_prompts):
                future = executor.submit(
                    self._generate_single_slide,
                    index=i,
                    slide=slide,
                    output_dir=output_path,
                    config=config
                )
                futures[future] = i
            
            # 收集结果
            for future in as_completed(futures):
                index = futures[future]
                try:
                    result_index, result_path, error = future.result()
                    if result_path:
                        results[result_index] = result_path
                    else:
                        print(f"❌ 第 {index + 1} 页生成失败: {error}")
                except Exception as e:
                    print(f"❌ 第 {index + 1} 页异常: {e}")
        
        # 统计结果
        valid_results = [r for r in results if r is not None]
        print(f"\n✅ 成功生成 {len(valid_results)}/{len(slide_prompts)} 页")
        
        return results
    
    def _generate_single_slide(
        self,
        index: int,
        slide: SlidePrompt,
        output_dir: Path,
        config: PPTConfig
    ) -> Tuple[int, Optional[str], Optional[str]]:
        """
        生成单页 PPT（文生图）
        
        Args:
            index: 页面索引
            slide: 页面 Prompt
            output_dir: 输出目录
            config: 配置
            
        Returns:
            (索引, 图片路径或None, 错误信息或None)
        """
        page = slide.page
        output_path = str(output_dir / f"slide_{page:03d}.png")
        
        for attempt in range(config.max_retries):
            try:
                print(f"  📄 生成第 {page} 页 (尝试 {attempt + 1}/{config.max_retries})...")
                
                # 使用文生图直接生成
                self.client.generate_image(
                    prompt=slide.prompt,
                    aspect_ratio=config.aspect_ratio,
                    quality=config.quality,
                    output_path=output_path
                )
                
                print(f"  ✅ 第 {page} 页生成成功")
                return (index, output_path, None)
                
            except Exception as e:
                error_msg = str(e)
                print(f"  ⚠️ 第 {page} 页尝试 {attempt + 1} 失败: {error_msg}")
                
                if attempt < config.max_retries - 1:
                    time.sleep(config.retry_delay)
        
        return (index, None, f"重试 {config.max_retries} 次后仍失败")

"""
导出模块
负责将生成的图片导出为 PDF
"""

import os
from pathlib import Path
from typing import List, Optional
from PIL import Image


class PDFExporter:
    """PDF 导出器"""
    
    @staticmethod
    def export(
        image_paths: List[str],
        output_path: str,
        title: str = "AI Generated PPT"
    ) -> str:
        """
        将多张图片合并为 PDF
        
        Args:
            image_paths: 图片路径列表（按顺序）
            output_path: 输出 PDF 路径
            title: PDF 标题
            
        Returns:
            输出 PDF 路径
        """
        if not image_paths:
            raise ValueError("图片列表为空")
        
        # 过滤有效图片
        valid_paths = [p for p in image_paths if p and os.path.exists(p)]
        
        if not valid_paths:
            raise ValueError("没有有效的图片")
        
        # 加载所有图片
        images = []
        for path in valid_paths:
            img = Image.open(path)
            # 转换为 RGB（PDF 不支持 RGBA）
            if img.mode != 'RGB':
                img = img.convert('RGB')
            images.append(img)
        
        # 保存为 PDF
        first_image = images[0]
        other_images = images[1:] if len(images) > 1 else []
        
        first_image.save(
            output_path,
            "PDF",
            resolution=100.0,
            save_all=True,
            append_images=other_images,
            title=title
        )
        
        print(f"✅ PDF 已生成: {output_path}")
        print(f"   共 {len(images)} 页")
        
        return output_path
    
    @staticmethod
    def export_from_directory(
        images_dir: str,
        output_path: str,
        pattern: str = "slide_*.png"
    ) -> str:
        """
        从目录导出 PDF
        
        Args:
            images_dir: 图片目录
            output_path: 输出 PDF 路径
            pattern: 文件匹配模式
            
        Returns:
            输出 PDF 路径
        """
        images_path = Path(images_dir)
        
        if not images_path.exists():
            raise FileNotFoundError(f"目录不存在: {images_dir}")
        
        # 按文件名排序
        image_paths = sorted([str(p) for p in images_path.glob(pattern)])
        
        if not image_paths:
            raise ValueError(f"目录中没有匹配的图片: {pattern}")
        
        return PDFExporter.export(image_paths, output_path)

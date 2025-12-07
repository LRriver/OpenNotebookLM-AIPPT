"""
PPT 生成器主模块
协调各个子模块完成 PPT 生成
"""

from pathlib import Path
from datetime import datetime
from typing import Optional

from .config import PPTConfig, APIConfig
from .client import AIClient
from .models import PromptData, GenerationResult
from .prompt_generator import PromptGenerator
from .image_generator import ImageGenerator
from .exporter import PDFExporter


class PPTGenerator:
    """PPT 生成器主类"""
    
    def __init__(
        self,
        api_config: APIConfig = None,
        output_dir: str = None
    ):
        """
        初始化生成器
        
        Args:
            api_config: API 配置
            output_dir: 输出目录（默认从配置文件读取）
        """
        from .config import get_output_dir
        
        self.api_config = api_config or APIConfig()
        self.output_dir = Path(output_dir or get_output_dir())
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # 初始化客户端和子模块
        self.client = AIClient(self.api_config)
        self.prompt_generator = PromptGenerator(self.client)
        self.image_generator = ImageGenerator(self.client)
        self.pdf_exporter = PDFExporter()
    
    def generate(
        self,
        source_material: str,
        ppt_config: PPTConfig = None,
        export_pdf: bool = True
    ) -> GenerationResult:
        """
        生成 PPT
        
        Args:
            source_material: 输入资料
            ppt_config: PPT 配置
            export_pdf: 是否导出 PDF
            
        Returns:
            GenerationResult 对象
        """
        if ppt_config is None:
            ppt_config = PPTConfig()
        
        # 创建项目目录
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        project_dir = self.output_dir / f"ppt_{timestamp}"
        project_dir.mkdir(parents=True, exist_ok=True)
        images_dir = project_dir / "images"
        images_dir.mkdir(exist_ok=True)
        
        self._print_header(project_dir, ppt_config)
        
        result = GenerationResult(
            project_dir=str(project_dir),
            created_at=datetime.now().isoformat()
        )
        
        try:
            # Step 1: 保存输入资料
            print("\n【Step 1】保存输入资料...")
            self._save_source_material(source_material, project_dir)
            
            # Step 2: 生成 Prompt
            print("\n【Step 2】生成 Prompt...")
            prompt_data = self.prompt_generator.generate(source_material, ppt_config)
            prompt_data.save(str(project_dir / "prompts.json"))
            result.prompt_data = prompt_data
            
            # Step 3: 生成图片
            print("\n【Step 3】并行生成 PPT 页面...")
            slide_images = self.image_generator.generate_slides(
                slide_prompts=prompt_data.slide_prompts,
                output_dir=str(images_dir),
                config=ppt_config
            )
            result.slide_image_paths = slide_images
            
            # Step 4: 导出 PDF
            if export_pdf:
                print("\n【Step 4】导出 PDF...")
                valid_images = [p for p in slide_images if p]
                if valid_images:
                    pdf_path = str(project_dir / "presentation.pdf")
                    self.pdf_exporter.export(valid_images, pdf_path)
            
            # 保存结果
            result.success = True
            result.save(str(project_dir / "result.json"))
            
            self._print_footer(result)
            
        except Exception as e:
            result.success = False
            result.error_message = str(e)
            result.save(str(project_dir / "result.json"))
            print(f"\n❌ 生成失败: {e}")
        
        return result
    
    def generate_prompts_only(
        self,
        source_material: str,
        ppt_config: PPTConfig = None,
        output_path: str = None
    ) -> PromptData:
        """
        仅生成 Prompt（不生成图片）
        
        Args:
            source_material: 输入资料
            ppt_config: PPT 配置
            output_path: 输出路径（可选）
            
        Returns:
            PromptData 对象
        """
        if ppt_config is None:
            ppt_config = PPTConfig()
        
        print("=" * 60)
        print("🎨 生成 PPT Prompt")
        print("=" * 60)
        
        prompt_data = self.prompt_generator.generate(source_material, ppt_config)
        
        if output_path:
            prompt_data.save(output_path)
        
        return prompt_data
    
    def generate_from_prompts(
        self,
        prompt_data: PromptData,
        ppt_config: PPTConfig = None,
        export_pdf: bool = True
    ) -> GenerationResult:
        """
        从已有的 Prompt 生成图片
        
        Args:
            prompt_data: Prompt 数据
            ppt_config: PPT 配置
            export_pdf: 是否导出 PDF
            
        Returns:
            GenerationResult 对象
        """
        if ppt_config is None:
            ppt_config = PPTConfig.from_dict(prompt_data.config) if prompt_data.config else PPTConfig()
        
        # 创建项目目录
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        project_dir = self.output_dir / f"ppt_{timestamp}"
        project_dir.mkdir(parents=True, exist_ok=True)
        images_dir = project_dir / "images"
        images_dir.mkdir(exist_ok=True)
        
        result = GenerationResult(
            project_dir=str(project_dir),
            prompt_data=prompt_data,
            created_at=datetime.now().isoformat()
        )
        
        try:
            # 保存 Prompt
            prompt_data.save(str(project_dir / "prompts.json"))
            
            # 并行生成每页 PPT
            print("\n[Step 1] 并行生成 PPT 页面...")
            slide_images = self.image_generator.generate_slides(
                slide_prompts=prompt_data.slide_prompts,
                output_dir=str(images_dir),
                config=ppt_config
            )
            result.slide_image_paths = slide_images
            
            # 导出 PDF
            if export_pdf:
                print("\n[Step 2] 导出 PDF...")
                valid_images = [p for p in slide_images if p]
                if valid_images:
                    pdf_path = str(project_dir / "presentation.pdf")
                    self.pdf_exporter.export(valid_images, pdf_path)
            
            result.success = True
            result.save(str(project_dir / "result.json"))
            
        except Exception as e:
            result.success = False
            result.error_message = str(e)
            print(f"\n❌ 生成失败: {e}")
        
        return result
    
    def _save_source_material(self, material: str, project_dir: Path):
        """保存输入资料"""
        material_path = project_dir / "source_material.txt"
        with open(material_path, 'w', encoding='utf-8') as f:
            f.write(material)
        print(f"✅ 资料已保存到: {material_path}")
    
    def _print_header(self, project_dir: Path, config: PPTConfig):
        """打印头部信息"""
        print("=" * 60)
        print("🎨 AI PPT 生成器")
        print("=" * 60)
        print(f"📁 输出目录: {project_dir}")
        print(f"📝 语言: {config.language}")
        print(f"🎯 风格: {config.style}")
        print(f"👥 目标受众: {config.target_audience}")
        print(f"📄 页数: {config.num_pages}")
        print(f"📐 比例: {config.aspect_ratio}")
        print(f"✨ 质量: {config.quality}")
        print("=" * 60)
    
    def _print_footer(self, result: GenerationResult):
        """打印尾部信息"""
        valid_count = len([p for p in result.slide_image_paths if p])
        total_count = len(result.slide_image_paths)
        
        print("\n" + "=" * 60)
        print("🎉 PPT 生成完成！")
        print(f"📁 输出目录: {result.project_dir}")
        print(f"📄 生成页数: {valid_count}/{total_count}")
        print("=" * 60)

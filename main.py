#!/usr/bin/env python3
"""
AI PPT 生成器 - 命令行入口
"""

import argparse
import sys
from pathlib import Path

from src import PPTGenerator, PPTConfig, APIConfig
from src.models import PromptData


def main():
    parser = argparse.ArgumentParser(
        description="AI PPT 生成器 - 将资料转换为精美的 PPT 图片",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 从文件生成 PPT
  python main.py -i doc/sample_paper.txt -n 5
  
  # 指定风格和受众
  python main.py -i doc/paper.txt -n 10 --style "科技感" --audience "投资人"
  
  # 仅生成 Prompt
  python main.py -i doc/paper.txt -n 5 --prompt-only -o prompts.json
  
  # 从 Prompt 文件生成图片
  python main.py --from-prompt prompts.json
        """
    )
    
    # 输入参数
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("-i", "--input", help="输入资料文件路径")
    input_group.add_argument("--from-prompt", help="从 Prompt JSON 文件生成")
    
    # PPT 配置
    parser.add_argument("-n", "--num-pages", type=int, default=8, help="生成页数")
    parser.add_argument("--style", default="现代简约商务风格", help="PPT 风格")
    parser.add_argument("--lang", default="中文", help="输出语言")
    parser.add_argument("--audience", default="专业人士", help="目标受众")
    parser.add_argument("--ratio", choices=["16:9", "4:3", "1:1"], default="16:9", help="图片比例")
    parser.add_argument("--quality", choices=["1K", "2K", "4K"], default="2K", help="图片质量")
    
    # 并发控制
    parser.add_argument("--concurrent", type=int, default=3, help="最大并发数")
    parser.add_argument("--retries", type=int, default=3, help="最大重试次数")
    
    # 输出选项
    parser.add_argument("-o", "--output", help="输出路径")
    parser.add_argument("--output-dir", default="output", help="输出目录")
    parser.add_argument("--prompt-only", action="store_true", help="仅生成 Prompt")
    parser.add_argument("--no-pdf", action="store_true", help="不导出 PDF")
    
    # API 配置（可选覆盖，默认从 config.yaml 读取）
    parser.add_argument("--api-key", default=None, help="API 密钥（覆盖配置文件）")
    parser.add_argument("--base-url", default=None, help="API 地址（覆盖配置文件）")
    
    args = parser.parse_args()
    
    # 创建配置（命令行参数覆盖配置文件）
    api_config = APIConfig(
        image_api_key=args.api_key,  # None 时使用配置文件默认值
        image_base_url=args.base_url
    )
    
    ppt_config = PPTConfig(
        language=args.lang if args.lang != "中文" else None,
        style=args.style if args.style != "现代简约商务风格" else None,
        target_audience=args.audience if args.audience != "专业人士" else None,
        num_pages=args.num_pages if args.num_pages != 10 else None,
        aspect_ratio=args.ratio if args.ratio != "16:9" else None,
        quality=args.quality if args.quality != "2K" else None,
        max_concurrent=args.concurrent if args.concurrent != 3 else None,
        max_retries=args.retries if args.retries != 3 else None
    )
    
    # 创建生成器
    generator = PPTGenerator(api_config=api_config, output_dir=args.output_dir)
    
    try:
        # 从 Prompt 文件生成
        if args.from_prompt:
            prompt_data = PromptData.load(args.from_prompt)
            result = generator.generate_from_prompts(prompt_data, ppt_config, export_pdf=not args.no_pdf)
            if result.success:
                print(f"\n🎉 完成！输出目录: {result.project_dir}")
            return 0 if result.success else 1
        
        # 读取输入文件
        input_path = Path(args.input)
        if not input_path.exists():
            print(f"❌ 输入文件不存在: {args.input}")
            return 1
        
        with open(input_path, 'r', encoding='utf-8') as f:
            source_material = f.read()
        
        if not source_material.strip():
            print("❌ 输入文件为空")
            return 1
        
        print(f"📄 读取资料: {len(source_material)} 字符")
        
        # 仅生成 Prompt
        if args.prompt_only:
            output_path = args.output or "prompts.json"
            prompt_data = generator.generate_prompts_only(source_material, ppt_config, output_path=output_path)
            print(f"\n🎉 完成！Prompt 已保存到: {output_path}")
            return 0
        
        # 完整生成
        result = generator.generate(source_material, ppt_config, export_pdf=not args.no_pdf)
        
        if result.success:
            print(f"\n🎉 完成！输出目录: {result.project_dir}")
        return 0 if result.success else 1
    
    except KeyboardInterrupt:
        print(f"\n\n🛑 程序已被用户中断")
        print(f"   💡 提示: 已完成的图片已保存在输出目录中")
        print(f"   💡 可以使用 --from-prompt 参数从已生成的 prompts.json 继续")
        return 130  # SIGINT 退出码
        
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

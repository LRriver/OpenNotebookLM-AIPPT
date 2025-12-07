#!/usr/bin/env python3
"""
PPT 生成器测试
测试只调用正式代码，配置从统一配置文件读取
"""

import sys
from pathlib import Path

# 添加 src 到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from src import PPTGenerator, PPTConfig
from src.config import load_sample_material
from src.models import PromptData


def test_full_generation():
    """完整测试：生成 PPT（使用默认配置，仅覆盖页数）"""
    print("=" * 60)
    print("🧪 测试：完整 PPT 生成流程")
    print("=" * 60)
    
    material = load_sample_material()
    print(f"📄 加载资料: {len(material)} 字符")
    
    # 使用默认配置，仅覆盖测试需要的参数
    ppt_config = PPTConfig(num_pages=3)
    
    # 创建生成器（配置从 config.yaml 读取）
    generator = PPTGenerator(output_dir="test_output")
    
    result = generator.generate(material, ppt_config)
    
    print("\n" + "=" * 60)
    if result.success:
        print(f"✅ 测试通过！输出目录: {result.project_dir}")
    else:
        print(f"❌ 测试失败: {result.error_message}")
    print("=" * 60)
    
    return result


def test_prompt_only():
    """仅测试 Prompt 生成"""
    print("=" * 60)
    print("🧪 测试：仅生成 Prompt")
    print("=" * 60)
    
    material = load_sample_material()
    print(f"📄 加载资料: {len(material)} 字符")
    
    # 使用默认配置，仅覆盖测试需要的参数
    ppt_config = PPTConfig(num_pages=3)
    
    # 创建生成器
    generator = PPTGenerator()
    
    prompt_data = generator.generate_prompts_only(
        material,
        ppt_config,
        output_path="test_prompts.json"
    )
    
    print("\n📄 页面 Prompt:")
    print("-" * 40)
    for slide in prompt_data.slide_prompts[:2]:
        print(f"\n第 {slide.page} 页: {slide.title}")
        print(f"摘要: {slide.content_summary}")
        prompt_preview = slide.prompt[:150] + "..." if len(slide.prompt) > 150 else slide.prompt
        print(f"Prompt: {prompt_preview}")
    
    print("\n" + "=" * 60)
    print("✅ Prompt 生成测试完成！")
    print("=" * 60)
    
    return prompt_data


def test_from_prompts():
    """从已有 Prompt 生成图片"""
    print("=" * 60)
    print("🧪 测试：从 Prompt 文件生成图片")
    print("=" * 60)
    
    prompt_path = Path("test_prompts.json")
    if not prompt_path.exists():
        print("⚠️ 请先运行 --mode prompt 生成 Prompt 文件")
        return None
    
    prompt_data = PromptData.load(str(prompt_path))
    print(f"📄 加载了 {len(prompt_data.slide_prompts)} 个页面 Prompt")
    
    # 创建生成器
    generator = PPTGenerator(output_dir="test_output")
    
    result = generator.generate_from_prompts(prompt_data)
    
    print("\n" + "=" * 60)
    if result.success:
        print(f"✅ 测试通过！输出目录: {result.project_dir}")
    else:
        print(f"❌ 测试失败: {result.error_message}")
    print("=" * 60)
    
    return result


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="PPT 生成器测试")
    parser.add_argument(
        "--mode",
        choices=["full", "prompt", "from-prompt"],
        default="full",
        help="测试模式: full=完整测试, prompt=仅生成Prompt, from-prompt=从Prompt生成"
    )
    
    args = parser.parse_args()
    
    if args.mode == "full":
        test_full_generation()
    elif args.mode == "prompt":
        test_prompt_only()
    elif args.mode == "from-prompt":
        test_from_prompts()

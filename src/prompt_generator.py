"""
Prompt 生成模块
负责生成和优化 PPT 的 Prompt
"""

import json
from datetime import datetime

from .client import AIClient
from .config import PPTConfig
from .models import PromptData, SlidePrompt
from .prompts import PromptTemplates


class PromptGenerator:
    """Prompt 生成器"""
    
    def __init__(self, client: AIClient):
        self.client = client
    
    def generate(self, source_material: str, config: PPTConfig) -> PromptData:
        """生成所有 Prompt"""
        user_requirements = self._build_user_requirements(config)
        
        # 第一步：生成初始 Prompt
        print("[Step 2.1] 生成初始 Prompt...")
        initial_prompts = self._generate_initial_prompts(source_material, user_requirements, config)
        
        # 第二步：检查和优化 Prompt
        print("[Step 2.2] 检查和优化 Prompt...")
        final_prompts = self._review_and_optimize_prompts(
            initial_prompts, source_material, user_requirements, config
        )
        
        return final_prompts
    
    def _build_user_requirements(self, config: PPTConfig) -> str:
        """构建用户需求描述"""
        return f"""- 语言：{config.language}
- 风格：{config.style}
- 目标受众：{config.target_audience}
- 页数：{config.num_pages} 页
- 图片比例：{config.aspect_ratio}
- 图片质量：{config.quality}"""
    
    def _generate_initial_prompts(
        self, source_material: str, user_requirements: str, config: PPTConfig
    ) -> PromptData:
        """生成初始 Prompt"""
        system_instruction = PromptTemplates.get_initial_prompt_system(user_requirements, config.num_pages)
        user_prompt = PromptTemplates.get_initial_prompt_user(source_material, config.num_pages)
        
        response = self.client.generate_text(user_prompt, system_instruction)
        
        prompt_data = self._parse_prompt_response(response, config)
        prompt_data.source_material = source_material[:2000]
        prompt_data.user_requirements = user_requirements
        
        print(f"✅ 生成了 {len(prompt_data.slide_prompts)} 个页面 Prompt")
        return prompt_data
    
    def _review_and_optimize_prompts(
        self, initial_prompts: PromptData, source_material: str, user_requirements: str, config: PPTConfig
    ) -> PromptData:
        """检查和优化 Prompt"""
        system_instruction = PromptTemplates.get_review_prompt_system()
        user_prompt = PromptTemplates.get_review_prompt_user(
            user_requirements,
            source_material,
            json.dumps(initial_prompts.to_dict(), ensure_ascii=False, indent=2)
        )
        
        response = self.client.generate_text(user_prompt, system_instruction)
        
        try:
            optimized = self._parse_prompt_response(response, config)
            optimized.source_material = initial_prompts.source_material
            optimized.user_requirements = initial_prompts.user_requirements
            print(f"✅ Prompt 优化完成，共 {len(optimized.slide_prompts)} 页")
            return optimized
        except Exception as e:
            print(f"⚠️ 优化响应解析失败: {e}，使用原始 Prompt")
            return initial_prompts
    
    def _parse_prompt_response(self, response: str, config: PPTConfig) -> PromptData:
        """解析 LLM 响应中的 JSON"""
        json_start = response.find('{')
        json_end = response.rfind('}') + 1
        
        if json_start == -1 or json_end <= json_start:
            raise ValueError("未找到有效的 JSON")
        
        json_str = response[json_start:json_end]
        data = json.loads(json_str)
        
        slide_prompts = []
        for item in data.get("slide_prompts", []):
            if isinstance(item, dict):
                slide_prompts.append(SlidePrompt(
                    page=item.get("page", len(slide_prompts) + 1),
                    title=item.get("title", ""),
                    content_summary=item.get("content_summary", ""),
                    prompt=item.get("prompt", "")
                ))
        
        return PromptData(
            slide_prompts=slide_prompts,
            created_at=datetime.now().isoformat(),
            config=config.to_dict()
        )

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
        """生成初始 Prompt（带重试机制）"""
        system_instruction = PromptTemplates.get_initial_prompt_system(user_requirements, config.num_pages)
        user_prompt = PromptTemplates.get_initial_prompt_user(source_material, config.num_pages)
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                print(f"   尝试生成 Prompt ({attempt + 1}/{max_retries})...")
                response = self.client.generate_text(user_prompt, system_instruction)
                
                # 验证响应格式
                prompt_data = self._parse_prompt_response(response, config)
                
                # 验证生成的页数是否正确
                if len(prompt_data.slide_prompts) != config.num_pages:
                    raise ValueError(f"生成页数不匹配: 期望{config.num_pages}页，实际{len(prompt_data.slide_prompts)}页")
                
                # 验证每页内容是否完整
                for i, slide in enumerate(prompt_data.slide_prompts):
                    if not slide.title or not slide.prompt:
                        raise ValueError(f"第{i+1}页内容不完整: title='{slide.title}', prompt长度={len(slide.prompt)}")
                
                prompt_data.source_material = source_material[:2000]
                prompt_data.user_requirements = user_requirements
                
                print(f"✅ 生成了 {len(prompt_data.slide_prompts)} 个页面 Prompt")
                return prompt_data
                
            except Exception as e:
                print(f"   ⚠️ 第 {attempt + 1} 次尝试失败: {e}")
                if attempt == max_retries - 1:
                    raise Exception(f"Prompt 生成失败，重试 {max_retries} 次后仍失败: {e}")
                
                import time
                time.sleep(2)  # 重试间隔
    
    def _review_and_optimize_prompts(
        self, initial_prompts: PromptData, source_material: str, user_requirements: str, config: PPTConfig
    ) -> PromptData:
        """检查和优化 Prompt（带重试机制）"""
        system_instruction = PromptTemplates.get_review_prompt_system()
        user_prompt = PromptTemplates.get_review_prompt_user(
            user_requirements,
            source_material,
            json.dumps(initial_prompts.to_dict(), ensure_ascii=False, indent=2)
        )
        
        max_retries = 2  # 优化步骤重试次数
        for attempt in range(max_retries):
            try:
                print(f"   尝试优化 Prompt ({attempt + 1}/{max_retries})...")
                response = self.client.generate_text(user_prompt, system_instruction)
                
                # 验证优化后的格式
                optimized = self._parse_prompt_response(response, config)
                
                # 验证优化后的页数
                if len(optimized.slide_prompts) != len(initial_prompts.slide_prompts):
                    raise ValueError(f"优化后页数变化: 原始{len(initial_prompts.slide_prompts)}页，优化后{len(optimized.slide_prompts)}页")
                
                optimized.source_material = initial_prompts.source_material
                optimized.user_requirements = initial_prompts.user_requirements
                print(f"✅ Prompt 优化完成，共 {len(optimized.slide_prompts)} 页")
                return optimized
                
            except Exception as e:
                print(f"   ⚠️ 优化第 {attempt + 1} 次尝试失败: {e}")
                if attempt == max_retries - 1:
                    print(f"⚠️ 优化失败，使用原始 Prompt")
                    return initial_prompts
                
                import time
                time.sleep(1)  # 优化重试间隔短一些
    
    def _parse_prompt_response(self, response: str, config: PPTConfig) -> PromptData:
        """解析 LLM 响应中的 JSON（增强错误处理）"""
        # 尝试多种方式提取 JSON
        json_str = None
        
        # 方式1：查找 { } 包围的内容
        json_start = response.find('{')
        json_end = response.rfind('}') + 1
        
        if json_start != -1 and json_end > json_start:
            json_str = response[json_start:json_end]
        else:
            # 方式2：查找 ```json 代码块
            import re
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # 方式3：查找任何 ``` 代码块
                code_match = re.search(r'```\s*(\{.*?\})\s*```', response, re.DOTALL)
                if code_match:
                    json_str = code_match.group(1)
        
        if not json_str:
            raise ValueError(f"未找到有效的 JSON 格式。响应内容: {response[:500]}...")
        
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON 解析失败: {e}。JSON内容: {json_str[:200]}...")
        
        # 验证必要字段
        if "slide_prompts" not in data:
            raise ValueError("响应中缺少 'slide_prompts' 字段")
        
        if not isinstance(data["slide_prompts"], list):
            raise ValueError("'slide_prompts' 必须是数组")
        
        slide_prompts = []
        for i, item in enumerate(data["slide_prompts"]):
            if not isinstance(item, dict):
                raise ValueError(f"第 {i+1} 个 slide_prompt 不是对象")
            
            # 验证必要字段
            required_fields = ["page", "title", "prompt"]
            for field in required_fields:
                if field not in item or not item[field]:
                    raise ValueError(f"第 {i+1} 个 slide_prompt 缺少或为空: {field}")
            
            slide_prompts.append(SlidePrompt(
                page=item.get("page", i + 1),
                title=item.get("title", ""),
                content_summary=item.get("content_summary", ""),
                prompt=item.get("prompt", "")
            ))
        
        return PromptData(
            slide_prompts=slide_prompts,
            created_at=datetime.now().isoformat(),
            config=config.to_dict()
        )

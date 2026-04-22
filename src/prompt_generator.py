"""
Prompt 生成模块
负责生成和优化 PPT 的 Prompt
"""

import json
import re
from datetime import datetime
from typing import Any

from .client import AIClient
from .config import PPTConfig
from .models import DeckOutline, PromptData, SlidePrompt, SlidePromptPlanSet
from .prompts import PromptTemplates


class PromptGenerator:
    """Prompt 生成器"""
    
    def __init__(self, client: AIClient):
        self.client = client
    
    def generate(self, source_material: str, config: PPTConfig) -> PromptData:
        """生成所有 Prompt"""
        user_requirements = self._build_user_requirements(config)

        print("[Step 2.1] 生成 PPT 设计大纲...")
        outline = self.generate_outline(source_material, config)

        print("[Step 2.2] 基于设计大纲生成逐页 Prompt...")
        initial_prompts = self.generate_prompts_from_outline(source_material, outline, config)

        print("[Step 2.3] 检查和优化 Prompt...")
        final_prompts = self._review_and_optimize_prompts(
            initial_prompts, source_material, user_requirements, config
        )
        
        return final_prompts

    def generate_outline(self, source_material: str, config: PPTConfig) -> DeckOutline:
        """生成用户可编辑的整套 PPT 设计大纲"""
        user_requirements = self._build_user_requirements(config)
        system_instruction = PromptTemplates.get_outline_system(user_requirements, config.num_pages)
        base_user_prompt = PromptTemplates.get_outline_user(source_material, config.num_pages)

        last_error = ""
        for attempt in range(3):
            try:
                print(f"   尝试生成设计大纲 ({attempt + 1}/3)...")
                user_prompt = self._with_correction(base_user_prompt, last_error)
                response = self.client.generate_text(user_prompt, system_instruction)
                outline = self._parse_model_response(response, DeckOutline)
                self._validate_outline(outline, config)
                print(f"✅ 设计大纲生成完成，共 {len(outline.slides)} 页")
                return outline
            except Exception as e:
                last_error = str(e)
                print(f"   ⚠️ 大纲第 {attempt + 1} 次尝试失败: {last_error}")
                if attempt == 2:
                    raise Exception(f"设计大纲生成失败，重试 3 次后仍失败: {last_error}")

        raise RuntimeError("设计大纲生成异常")

    def generate_prompts_from_outline(
        self,
        source_material: str,
        outline: DeckOutline | dict,
        config: PPTConfig,
    ) -> PromptData:
        """根据用户确认后的大纲生成逐页设计说明和图像 Prompt"""
        user_requirements = self._build_user_requirements(config)
        outline_model = self._coerce_model(outline, DeckOutline)
        self._validate_outline(outline_model, config)
        outline_json = self._model_to_json(outline_model)

        system_instruction = PromptTemplates.get_prompts_from_outline_system(user_requirements, config.num_pages)
        base_user_prompt = PromptTemplates.get_prompts_from_outline_user(
            source_material,
            outline_json,
            config.num_pages,
        )

        last_error = ""
        for attempt in range(3):
            try:
                print(f"   尝试生成逐页设计 ({attempt + 1}/3)...")
                user_prompt = self._with_correction(base_user_prompt, last_error)
                response = self.client.generate_text(user_prompt, system_instruction)
                prompt_plan = self._parse_model_response(response, SlidePromptPlanSet)
                self._validate_prompt_plan(prompt_plan, config)
                prompt_data = self._prompt_plan_to_prompt_data(prompt_plan, source_material, user_requirements, config)
                print(f"✅ 逐页 Prompt 生成完成，共 {len(prompt_data.slide_prompts)} 页")
                return prompt_data
            except Exception as e:
                last_error = str(e)
                print(f"   ⚠️ 逐页设计第 {attempt + 1} 次尝试失败: {last_error}")
                if attempt == 2:
                    raise Exception(f"逐页设计生成失败，重试 3 次后仍失败: {last_error}")

        raise RuntimeError("逐页设计生成异常")
    
    def _build_user_requirements(self, config: PPTConfig) -> str:
        """构建用户需求描述"""
        custom = (config.user_requirements or "").strip()
        custom_line = f"\n- 用户定制要求：{custom}" if custom else ""
        return f"""- 语言：{config.language}
- 风格：{config.style}
- 目标受众：{config.target_audience}
- 页数：{config.num_pages} 页
- 图片比例：{config.aspect_ratio}
- 图片质量：{config.quality}{custom_line}"""
    
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
        data = self._parse_json_payload(response)
        
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

    def _parse_json_payload(self, response: str) -> Any:
        """从模型响应中提取 JSON 对象"""
        json_str = None

        json_match = re.search(r'```json\s*(\{.*?\})\s*```', response, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            code_match = re.search(r'```\s*(\{.*?\})\s*```', response, re.DOTALL)
            if code_match:
                json_str = code_match.group(1)
            else:
                json_start = response.find('{')
                json_end = response.rfind('}') + 1
                if json_start != -1 and json_end > json_start:
                    json_str = response[json_start:json_end]

        if not json_str:
            raise ValueError(f"未找到有效的 JSON 格式。响应内容: {response[:500]}...")

        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON 解析失败: {e}。JSON内容: {json_str[:200]}...")

    def _parse_model_response(self, response: str, model_cls):
        """提取 JSON 并交给 Pydantic schema 校验"""
        data = self._parse_json_payload(response)
        return self._coerce_model(data, model_cls)

    def _coerce_model(self, data: Any, model_cls):
        if isinstance(data, model_cls):
            return data
        if hasattr(model_cls, "model_validate"):
            return model_cls.model_validate(data)
        return model_cls.parse_obj(data)

    def _model_to_dict(self, model: Any) -> dict:
        if hasattr(model, "model_dump"):
            return model.model_dump()
        return model.dict()

    def _model_to_json(self, model: Any) -> str:
        return json.dumps(self._model_to_dict(model), ensure_ascii=False, indent=2)

    def _with_correction(self, user_prompt: str, last_error: str) -> str:
        if not last_error:
            return user_prompt
        return (
            f"{user_prompt}\n\n"
            "【上一次输出校验失败】\n"
            f"{last_error}\n"
            "请修正后重新输出完整 JSON，特别注意页数、字段完整性和格式。"
        )

    def _validate_outline(self, outline: DeckOutline, config: PPTConfig) -> None:
        if len(outline.slides) != config.num_pages:
            raise ValueError(f"大纲页数不匹配: 期望{config.num_pages}页，实际{len(outline.slides)}页")

        pages = [slide.page for slide in outline.slides]
        expected = list(range(1, config.num_pages + 1))
        if pages != expected:
            raise ValueError(f"大纲页码必须连续为 {expected}，实际为 {pages}")

        for slide in outline.slides:
            if not slide.key_points:
                raise ValueError(f"第 {slide.page} 页缺少 key_points")

        if (config.user_requirements or "").strip() and not outline.user_requirements.strip():
            raise ValueError("大纲未说明已吸收的用户定制要求")

    def _validate_prompt_plan(self, prompt_plan: SlidePromptPlanSet, config: PPTConfig) -> None:
        if len(prompt_plan.slide_prompts) != config.num_pages:
            raise ValueError(
                f"逐页设计页数不匹配: 期望{config.num_pages}页，实际{len(prompt_plan.slide_prompts)}页"
            )

        pages = [slide.page for slide in prompt_plan.slide_prompts]
        expected = list(range(1, config.num_pages + 1))
        if pages != expected:
            raise ValueError(f"逐页设计页码必须连续为 {expected}，实际为 {pages}")

        required_prefix = "你生成的 PPT 其中一页的内容，要图文并茂。"
        for slide in prompt_plan.slide_prompts:
            if not slide.prompt.startswith(required_prefix):
                raise ValueError(f"第 {slide.page} 页 prompt 必须以固定前缀开头")
            if len(slide.display_content.strip()) < 20:
                raise ValueError(f"第 {slide.page} 页 display_content 过短，无法供用户审阅")

    def _prompt_plan_to_prompt_data(
        self,
        prompt_plan: SlidePromptPlanSet,
        source_material: str,
        user_requirements: str,
        config: PPTConfig,
    ) -> PromptData:
        slide_prompts = [
            SlidePrompt(
                page=item.page,
                title=item.title,
                content_summary=item.content_summary,
                prompt=item.prompt,
                display_content=item.display_content,
            )
            for item in prompt_plan.slide_prompts
        ]
        return PromptData(
            slide_prompts=slide_prompts,
            created_at=datetime.now().isoformat(),
            config=config.to_dict(),
            source_material=source_material[:2000],
            user_requirements=user_requirements,
        )

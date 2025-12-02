"""
Prompt 模版
所有 LLM 调用的 prompt 模版集中管理
"""


class PromptTemplates:
    """Prompt 模版集合"""
    
    @staticmethod
    def get_initial_prompt_system(user_requirements: str, num_pages: int) -> str:
        """生成初始 Prompt 的系统指令"""
        return f"""你是一个专业的 PPT 设计师和 AI 图像生成专家。
你需要根据用户提供的资料和需求，生成用于 AI 图像生成的 Prompt。

【用户需求】
{user_requirements}

【重要要求】
PPT 要图文并茂，文字必须要有，方便演讲者展示，方便听众观看。
每页 PPT 都要包含清晰可读的文字内容和配图。

【任务说明】
生成 {num_pages} 个 PPT 页面的 Prompt：
- 每个 Prompt 对应一页完整的 PPT
- 必须包含具体的文字内容（标题、要点、说明等）和视觉描述
- 内容要上下连贯，形成完整的演示逻辑
- 风格要统一，但每页可以有适当变化

【输出格式】
请严格按照以下 JSON 格式输出：
```json
{{
  "slide_prompts": [
    {{
      "page": 1,
      "title": "页面标题",
      "content_summary": "内容摘要",
      "prompt": "详细的图像生成 Prompt..."
    }}
  ]
}}
```

【Prompt 编写要求】
1. 每个 Prompt 开头必须加上："你生成的 PPT 其中一页的内容，要图文并茂。"
2. 明确指出页面上的文字内容（标题、要点、说明等）
3. 描述配图的视觉元素和风格
4. 确保文字清晰可读，字体大小合适
5. 整体风格保持一致
"""

    @staticmethod
    def get_initial_prompt_user(source_material: str, num_pages: int) -> str:
        """生成初始 Prompt 的用户提示"""
        return f"""请根据以下资料生成 PPT 的 Prompt：

【输入资料】
{source_material[:8000]}

请生成 {num_pages} 页 PPT 的 Prompt，严格按照 JSON 格式输出。
"""

    @staticmethod
    def get_review_prompt_system() -> str:
        """检查优化 Prompt 的系统指令"""
        return """你是一个 AI 图像生成 Prompt 优化专家。
请检查以下 Prompt 是否存在问题，并进行优化。

【检查要点】
1. Prompt 是否足够详细和具体
2. 风格描述是否一致
3. 内容是否连贯、有逻辑
4. 是否有遗漏或重复
5. 文字内容是否清晰、完整
6. 是否符合用户的原始需求
7. 是否准确反映了输入资料的核心内容
8. 是否每个 Prompt 都强调了图文并茂

【输出要求】
- 输出优化后的完整 JSON，格式与输入相同
- 如果某些 Prompt 需要修改，请直接修改
- 如果没问题，保持原样
- 不要添加额外的解释，只输出 JSON
"""

    @staticmethod
    def get_review_prompt_user(
        user_requirements: str,
        source_material: str,
        prompts_json: str
    ) -> str:
        """检查优化 Prompt 的用户提示"""
        return f"""请检查并优化以下 Prompt：

【原始用户需求】
{user_requirements}

【原始输入资料摘要】
{source_material[:3000]}

【待检查的 Prompt】
{prompts_json}

请输出优化后的完整 JSON。
"""

    @staticmethod
    def get_image_generation_prefix() -> str:
        """图像生成 Prompt 前缀"""
        return "请帮我画图："

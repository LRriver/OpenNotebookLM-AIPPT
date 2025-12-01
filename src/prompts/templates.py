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

【任务说明】
你需要生成两类 Prompt：

1. 【风格模版 Prompt】
   - 用于生成一张风格参考图
   - 不需要具体内容，只需要展示整体视觉风格
   - 包括：配色方案、排版风格、设计元素、字体风格等
   - 这张图会作为后续所有页面的风格参考
   - 最重要的是，这个风格背景需要适合作为PPT，同时存放插图和文字

2. 【每页 PPT 的 Prompt】
   - 共 {num_pages} 个 Prompt，每个对应一页 PPT
   - 需要包含具体内容和视觉描述
   - 内容需要包括本页PPT上的文字、图标、流程图、插图等的描述，必须要有配套的文字，不能只有图
   - 风格要与模版保持一致
   - 内容要上下连贯，形成完整的演示逻辑
   - 每个 Prompt 的开始都要提到"这是生成PPT的一页内容，参考风格模版，保持整体风格统一，但颜色和设计可适当变化，必须要图文并茂，方便向听众展示讲解"

【输出格式】
请严格按照以下 JSON 格式输出：
```json
{{
  "style_template_prompt": "风格模版的详细描述...",
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

【注意事项】
- Prompt 要详细、具体，便于 AI 图像生成
- 确保文字内容清晰可读
- 每页内容要有逻辑递进关系
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
5. 文字内容是否清晰
6. 是否符合用户的原始需求
7. 是否准确反映了输入资料的核心内容

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

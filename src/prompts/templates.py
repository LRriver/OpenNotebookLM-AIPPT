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

【核心要求】
1. PPT 必须图文并茂，每页都要有清晰可读的文字内容（标题、要点、说明）和相关配图
2. 文字是给演讲者和听众看的，必须清晰、重点突出、易于理解
3. 配图要与文字内容相关，起到辅助说明和视觉美化的作用

【PPT 结构要求 - {num_pages} 页】
请按照以下逻辑结构组织 PPT 内容：
- 第 1 页：封面页 - 包含主题标题、副标题、演讲者/来源信息，配以主题相关的视觉元素
- 第 2 页：目录/概述页 - 列出 PPT 的主要内容板块，让听众了解整体结构
- 第 3 至 {num_pages - 1} 页：内容页 - 按逻辑顺序展开核心内容，每页聚焦一个要点
- 第 {num_pages} 页：总结/结语页 - 总结核心观点，或提出展望/行动号召

【页面间的逻辑关联】
- 内容要有清晰的逻辑递进：引入问题 → 分析原因 → 提出方案 → 展示效果 → 总结展望
- 前后页面要有承接关系，可以通过"首先/其次/最后"、"问题/方案"、"现状/未来"等方式串联
- 每页的 content_summary 要体现该页在整体逻辑中的位置和作用

【每张 PPT 图片的 Prompt 编写要求】
1. 每个 Prompt 开头必须加上："你生成的 PPT 其中一页的内容，要图文并茂。"
2. 明确指出页面上的文字内容：
   - 标题（大字，醒目）
   - 要点/正文（3-5 个要点，或 2-3 段简短说明）
   - 可选：数据、引用、注释
3. 描述配图的视觉元素：
   - 图片类型（图标、插图、图表、照片风格等）
   - 图片位置（左侧、右侧、背景、点缀等）
   - 图片内容（与文字内容相关的具体视觉元素）
4. 统一视觉风格：
   - 配色方案保持一致（根据用户指定的风格）
   - 字体风格统一（标题字体、正文字体）
   - 布局风格统一（对齐方式、留白比例）
5. 确保文字清晰可读，字体大小合适，对比度足够

【输出格式】
请严格按照以下 JSON 格式输出：
```json
{{
  "slide_prompts": [
    {{
      "page": 1,
      "title": "页面标题",
      "content_summary": "本页在整体逻辑中的作用和核心内容摘要",
      "prompt": "你生成的 PPT 其中一页的内容，要图文并茂。[详细的图像生成描述...]"
    }}
  ]
}}
```

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

【结构完整性检查】
1. 是否有封面页（第 1 页）- 包含主题标题和视觉元素
2. 是否有目录/概述页（第 2 页）- 展示整体结构
3. 内容页是否按逻辑顺序展开
4. 是否有总结/结语页（最后一页）

【逻辑递进检查】
1. 页面之间是否有清晰的逻辑关联
2. 内容是否有递进关系（问题→分析→方案→效果→总结）
3. 是否有重复或跳跃的内容
4. content_summary 是否体现了该页在整体中的位置

【内容质量检查】
1. 每个 Prompt 是否以"你生成的 PPT 其中一页的内容，要图文并茂。"开头
2. 文字内容是否具体（标题、要点、说明）
3. 配图描述是否与文字内容相关
4. 是否准确反映了输入资料的核心内容
5. 是否符合用户的原始需求

【视觉一致性检查】
1. 配色方案是否统一
2. 布局风格是否一致
3. 字体描述是否统一

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

【优化重点】
1. 确保页面间有清晰的逻辑递进关系
2. 确保每页的 content_summary 说明了该页在整体逻辑中的作用
3. 确保视觉风格描述一致
4. 确保每个 Prompt 都以"你生成的 PPT 其中一页的内容，要图文并茂。"开头

请输出优化后的完整 JSON。
"""

    @staticmethod
    def get_image_generation_prefix() -> str:
        """图像生成 Prompt 前缀"""
        return "请帮我画图："

import json

import pytest

from src.config import PPTConfig
from src.models import DeckOutline
from src.prompt_generator import PromptGenerator


class FakeTextClient:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def generate_text(self, prompt, system_instruction=None):
        self.calls.append((prompt, system_instruction))
        if not self.responses:
            raise AssertionError("No fake response left")
        return self.responses.pop(0)


def _outline(page_count=3):
    return {
        "title": "L9 实验设计",
        "user_requirements": "已强调架构、风险和研发受众",
        "design_style": "克制科技风",
        "audience": "研发团队",
        "slides": [
            {
                "page": page,
                "title": f"第 {page} 页",
                "narrative_goal": f"说明第 {page} 个叙事节点",
                "key_points": [f"要点 {page}.1", f"要点 {page}.2"],
                "visual_direction": "左文右图，低饱和科技配色",
            }
            for page in range(1, page_count + 1)
        ],
    }


def _prompt_plan(page_count=3):
    return {
        "slide_prompts": [
            {
                "page": page,
                "title": f"第 {page} 页",
                "content_summary": f"第 {page} 页摘要",
                "display_content": f"第 {page} 页展示标题、两条核心要点和一张架构示意图，便于用户审阅。",
                "prompt": "你生成的 PPT 其中一页的内容，要图文并茂。"
                f"第 {page} 页，标题为第 {page} 页，包含清晰文字和架构插图。",
            }
            for page in range(1, page_count + 1)
        ]
    }


def test_generate_outline_retries_and_validates_page_count():
    bad = _outline(page_count=2)
    good = _outline(page_count=3)
    client = FakeTextClient([json.dumps(bad, ensure_ascii=False), json.dumps(good, ensure_ascii=False)])
    generator = PromptGenerator(client)
    config = PPTConfig(num_pages=3, user_requirements="强调架构风险", target_audience="研发团队")

    outline = generator.generate_outline("source", config)

    assert isinstance(outline, DeckOutline)
    assert len(outline.slides) == 3
    assert len(client.calls) == 2
    assert "上一次输出校验失败" in client.calls[1][0]
    assert "强调架构风险" in client.calls[0][1]


def test_generate_prompts_from_outline_keeps_display_content_and_exact_pages():
    client = FakeTextClient([json.dumps(_prompt_plan(3), ensure_ascii=False)])
    generator = PromptGenerator(client)
    config = PPTConfig(num_pages=3, user_requirements="强调架构风险")

    prompt_data = generator.generate_prompts_from_outline("source", _outline(3), config)

    assert len(prompt_data.slide_prompts) == 3
    assert prompt_data.slide_prompts[0].display_content.startswith("第 1 页展示")
    assert prompt_data.slide_prompts[0].prompt.startswith("你生成的 PPT 其中一页的内容，要图文并茂。")


def test_generate_prompts_from_outline_rejects_internal_prompt_without_prefix():
    bad_plan = _prompt_plan(2)
    bad_plan["slide_prompts"][0]["prompt"] = "画一页 PPT"
    client = FakeTextClient([json.dumps(bad_plan, ensure_ascii=False)] * 3)
    generator = PromptGenerator(client)
    config = PPTConfig(num_pages=2)

    with pytest.raises(Exception, match="逐页设计生成失败"):
        generator.generate_prompts_from_outline("source", _outline(2), config)

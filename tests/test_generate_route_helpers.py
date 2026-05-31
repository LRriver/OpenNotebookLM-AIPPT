from api.models import ConfirmedSlidePrompt, GenerationConfig, GenerationRequest
from api.routes.generate import _prompt_data_from_confirmed
from src.config import PPTConfig


def test_confirmed_slide_prompts_are_sorted_by_page():
    ppt_config = PPTConfig(num_pages=3)
    request = GenerationRequest(
        content="# Source",
        config=GenerationConfig(page_count=3),
        slide_prompts=[
            ConfirmedSlidePrompt(page=2, title="Two", content_summary="Second", prompt="Prompt 2"),
            ConfirmedSlidePrompt(page=1, title="One", content_summary="First", prompt="Prompt 1"),
            ConfirmedSlidePrompt(page=3, title="Three", content_summary="Third", prompt="Prompt 3"),
        ],
    )

    prompt_data = _prompt_data_from_confirmed(request, ppt_config)

    assert [slide.page for slide in prompt_data.slide_prompts] == [1, 2, 3]
    assert [slide.title for slide in prompt_data.slide_prompts] == ["One", "Two", "Three"]

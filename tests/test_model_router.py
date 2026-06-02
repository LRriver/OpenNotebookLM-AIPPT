import unittest
from types import SimpleNamespace
from unittest.mock import patch

from src.model_profiles import ModelProfile, ModelProfileSet
from src.model_router import ModelRouter


class ModelRouterTest(unittest.TestCase):
    def test_generate_text_passes_thinking_extra_body(self):
        profiles = ModelProfileSet(
            prompt=ModelProfile(
                role="prompt",
                model="text-model",
                base_url="https://text.example/v1",
                api_key="text-key",
                thinking="enabled",
            ),
            image=ModelProfile(
                role="image",
                model="image-model",
                base_url="https://image.example/v1",
                api_key="image-key",
                adapter="raw_chat_multimodal",
            ),
            edit=ModelProfile(
                role="edit",
                model="image-model",
                base_url="https://image.example/v1",
                api_key="image-key",
                adapter="raw_chat_multimodal",
            ),
        )

        response = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content="ok"))]
        )

        with patch("src.model_router.OpenAI") as openai_cls:
            create = openai_cls.return_value.chat.completions.create
            create.return_value = response

            result = ModelRouter(profiles).generate_text("hello")

        self.assertEqual(result, "ok")
        create.assert_called_once()
        self.assertEqual(
            create.call_args.kwargs["extra_body"],
            {"thinking": {"type": "enabled"}},
        )


if __name__ == "__main__":
    unittest.main()

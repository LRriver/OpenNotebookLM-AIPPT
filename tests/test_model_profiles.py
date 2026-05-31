import unittest

from src.model_profiles import ModelProfile, ModelProfileSet, load_default_profiles, load_profiles_from_env, resolve_model_profiles


class ModelProfileResolutionTest(unittest.TestCase):
    def test_edit_profile_inherits_image_profile_by_default(self):
        profiles = resolve_model_profiles(
            {
                "prompt_model": {
                    "id": "prompt",
                    "model": "DeepSeek-V4-Pro",
                    "base_url": "https://text.example/v1",
                    "api_key": "text-key",
                    "adapter": "openai_chat",
                },
                "image_model": {
                    "id": "image",
                    "model": "gpt-image-2",
                    "base_url": "https://image.example/v1",
                    "api_key": "image-key",
                    "adapter": "raw_chat_multimodal",
                },
            }
        )

        self.assertEqual(profiles.edit.model, "gpt-image-2")
        self.assertEqual(profiles.edit.base_url, "https://image.example/v1")
        self.assertEqual(profiles.edit.api_key, "image-key")
        self.assertEqual(profiles.edit.adapter, "raw_chat_multimodal")

    def test_explicit_edit_profile_overrides_image_profile(self):
        profiles = resolve_model_profiles(
            {
                "prompt_model": {"model": "text", "base_url": "https://t/v1", "api_key": "t"},
                "image_model": {"model": "image", "base_url": "https://i/v1", "api_key": "i"},
                "edit_model": {
                    "model": "edit",
                    "base_url": "https://e/v1",
                    "api_key": "e",
                    "adapter": "raw_chat_multimodal",
                },
            }
        )

        self.assertEqual(profiles.edit.model, "edit")
        self.assertEqual(profiles.edit.base_url, "https://e/v1")
        self.assertEqual(profiles.edit.api_key, "e")

    def test_public_view_masks_api_keys(self):
        profiles = ModelProfileSet(
            prompt=ModelProfile(role="prompt", model="text", base_url="https://t/v1", api_key="secret"),
            image=ModelProfile(role="image", model="image", base_url="https://i/v1", api_key="secret"),
            edit=ModelProfile(role="edit", model="image", base_url="https://i/v1", api_key="secret"),
        )

        public = profiles.to_public_dict()

        self.assertEqual(public["prompt_model"]["api_key"], "SET")
        self.assertEqual(public["image_model"]["api_key"], "SET")
        self.assertEqual(public["edit_model"]["api_key"], "SET")

    def test_default_profiles_do_not_load_external_env_file(self):
        self.assertIsNone(load_profiles_from_env())
        self.assertIsNone(load_default_profiles({}))


if __name__ == "__main__":
    unittest.main()

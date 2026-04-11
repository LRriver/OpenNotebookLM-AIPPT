import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import yaml

from src.config_writer import save_model_profiles_to_config


class ConfigWriterTest(unittest.TestCase):
    def test_saves_model_profiles_to_config_yaml(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = Path(temp_dir) / "config.yaml"

            with patch("src.config_writer.load_yaml_config", return_value={"ppt": {"num_pages": 3}}), \
                 patch("src.config_writer.reload_config"):
                save_model_profiles_to_config(
                    {
                        "prompt_model": {
                            "model": "text",
                            "base_url": "https://text.example/v1",
                            "api_key": "text-key",
                            "adapter": "openai_chat",
                        },
                        "image_model": {
                            "model": "image",
                            "base_url": "https://image.example/v1",
                            "api_key": "image-key",
                            "adapter": "raw_chat_multimodal",
                        },
                    },
                    config_path=config_path,
                )

            saved = yaml.safe_load(config_path.read_text())
            self.assertEqual(saved["ppt"]["num_pages"], 3)
            self.assertEqual(saved["api"]["models"]["prompt_model"]["api_key"], "text-key")
            self.assertEqual(saved["api"]["models"]["image_model"]["model"], "image")

    def test_empty_api_key_preserves_existing_secret(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = Path(temp_dir) / "config.yaml"

            with patch("src.config_writer.load_yaml_config", return_value={
                "api": {
                    "models": {
                        "prompt_model": {"api_key": "old-text-key"},
                        "image_model": {"api_key": "old-image-key"},
                    }
                }
            }), patch("src.config_writer.reload_config"):
                save_model_profiles_to_config(
                    {
                        "prompt_model": {
                            "model": "new-text",
                            "base_url": "https://text.example/v1",
                            "api_key": "",
                            "adapter": "openai_chat",
                        },
                        "image_model": {
                            "model": "new-image",
                            "base_url": "https://image.example/v1",
                            "api_key": "",
                            "adapter": "raw_chat_multimodal",
                        },
                    },
                    config_path=config_path,
                )

            saved = yaml.safe_load(config_path.read_text())
            self.assertEqual(saved["api"]["models"]["prompt_model"]["api_key"], "old-text-key")
            self.assertEqual(saved["api"]["models"]["image_model"]["api_key"], "old-image-key")


if __name__ == "__main__":
    unittest.main()

import base64
import unittest

from src.image_result import ImageResultNormalizer


class ImageResultNormalizerTest(unittest.TestCase):
    def test_extracts_markdown_image_url_and_converts_to_base64(self):
        png_bytes = b"\x89PNG\r\n\x1a\nfake-image"

        def fetcher(url: str) -> bytes:
            self.assertEqual(url, "https://example.test/slide.png")
            return png_bytes

        result = ImageResultNormalizer(fetcher=fetcher).normalize(
            {
                "choices": [
                    {
                        "message": {
                            "content": "![image](https://example.test/slide.png)\n"
                        }
                    }
                ]
            }
        )

        self.assertEqual(result.base64_data, base64.b64encode(png_bytes).decode())
        self.assertEqual(result.mime_type, "image/png")
        self.assertEqual(result.source, "url")

    def test_accepts_b64_json_from_image_endpoint(self):
        encoded = base64.b64encode(b"image-bytes").decode()

        result = ImageResultNormalizer().normalize(
            {"data": [{"b64_json": encoded}]}
        )

        self.assertEqual(result.base64_data, encoded)
        self.assertEqual(result.source, "base64")

    def test_accepts_data_url(self):
        encoded = base64.b64encode(b"image-bytes").decode()

        result = ImageResultNormalizer().normalize(
            f"data:image/jpeg;base64,{encoded}"
        )

        self.assertEqual(result.base64_data, encoded)
        self.assertEqual(result.mime_type, "image/jpeg")
        self.assertEqual(result.source, "base64")

    def test_accepts_plain_base64(self):
        encoded = base64.b64encode(b"image-bytes").decode()

        result = ImageResultNormalizer().normalize(encoded)

        self.assertEqual(result.base64_data, encoded)
        self.assertEqual(result.mime_type, "image/png")
        self.assertEqual(result.source, "base64")


if __name__ == "__main__":
    unittest.main()

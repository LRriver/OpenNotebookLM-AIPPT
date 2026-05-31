import tempfile
import unittest
import asyncio
import base64
from pathlib import Path

from PIL import Image
from pptx import Presentation

from api.models import ExportRequest, ExportSlide
from api.routes.export import _export_pptx, export_presentation


class ExportPptxRatioTest(unittest.TestCase):
    def test_exports_4_3_pptx_when_requested(self):
        with tempfile.TemporaryDirectory() as tmp:
            image_path = Path(tmp) / "slide.png"
            output_path = Path(tmp) / "presentation.pptx"
            Image.new("RGB", (800, 600), "white").save(image_path)

            _export_pptx([str(image_path)], str(output_path), aspect_ratio="4:3")

            prs = Presentation(str(output_path))

        ratio = prs.slide_width / prs.slide_height
        self.assertAlmostEqual(ratio, 4 / 3, places=2)

    def test_export_response_cleans_temp_directory_after_send(self):
        with tempfile.TemporaryDirectory() as tmp:
            image_path = Path(tmp) / "slide.png"
            Image.new("RGB", (800, 450), "white").save(image_path)
            image_base64 = base64.b64encode(image_path.read_bytes()).decode()

        request = ExportRequest(
            slides=[ExportSlide(image_base64=image_base64)],
            format="pptx",
        )
        response = asyncio.run(export_presentation(request))
        output_path = Path(response.path)

        self.assertTrue(output_path.exists())
        self.assertIsNotNone(response.background)
        asyncio.run(response.background())
        self.assertFalse(output_path.parent.exists())


if __name__ == "__main__":
    unittest.main()

import tempfile
import unittest
from pathlib import Path

from PIL import Image
from pptx import Presentation

from api.routes.export import _export_pptx


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


if __name__ == "__main__":
    unittest.main()

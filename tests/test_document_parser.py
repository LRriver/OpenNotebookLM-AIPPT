import tempfile
import unittest
from pathlib import Path

from src.document_parser import DocumentParser


class DocumentParserTest(unittest.TestCase):
    def test_markdown_is_returned_as_normalized_markdown(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "paper.md"
            path.write_text("# Title\n\nBody", encoding="utf-8")

            result = DocumentParser().parse(path)

        self.assertEqual(result.filename, "paper.md")
        self.assertEqual(result.normalized_markdown, "# Title\n\nBody")
        self.assertEqual(result.metadata["parser"], "markdown")

    def test_txt_is_wrapped_as_markdown_text(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "notes.txt"
            path.write_text("Line 1\nLine 2", encoding="utf-8")

            result = DocumentParser().parse(path)

        self.assertEqual(result.normalized_markdown, "Line 1\nLine 2")
        self.assertEqual(result.metadata["parser"], "text")

    def test_text_pdf_is_parsed_with_lightweight_pdf_extractor(self):
        pdf_bytes = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 44 >> stream
BT /F1 24 Tf 72 720 Td (Hello PDF text) Tj ET
endstream endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000311 00000 n 
trailer << /Root 1 0 R /Size 6 >>
startxref
405
%%EOF
"""
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "manual.pdf"
            path.write_bytes(pdf_bytes)

            result = DocumentParser().parse(path)

        self.assertIn("Hello PDF text", result.normalized_markdown)
        self.assertEqual(result.metadata["parser"], "pypdf")

    def test_unsupported_extension_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "archive.zip"
            path.write_bytes(b"zip")

            with self.assertRaises(ValueError):
                DocumentParser().parse(path)


if __name__ == "__main__":
    unittest.main()

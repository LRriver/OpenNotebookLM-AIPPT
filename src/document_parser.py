"""
Document parsing facade.

Docling is used for rich office/PDF formats when available. Markdown and plain
text stay lightweight and do not require Docling.
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional


@dataclass
class ParsedDocument:
    filename: str
    normalized_markdown: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class DocumentParser:
    supported_extensions = {".md", ".markdown", ".txt", ".pdf", ".docx", ".pptx"}

    def parse(self, path: Path) -> ParsedDocument:
        path = Path(path)
        suffix = path.suffix.lower()
        if suffix not in self.supported_extensions:
            raise ValueError(f"不支持的文件格式: {suffix}")

        if suffix in {".md", ".markdown"}:
            return ParsedDocument(
                filename=path.name,
                normalized_markdown=path.read_text(encoding="utf-8"),
                metadata={"parser": "markdown"},
            )

        if suffix == ".txt":
            return ParsedDocument(
                filename=path.name,
                normalized_markdown=path.read_text(encoding="utf-8"),
                metadata={"parser": "text"},
            )

        if suffix == ".pdf":
            parsed_pdf = self._parse_pdf_text(path)
            if parsed_pdf and parsed_pdf.normalized_markdown.strip():
                return parsed_pdf

        return self._parse_with_docling(path)

    def _parse_pdf_text(self, path: Path) -> Optional[ParsedDocument]:
        try:
            from pypdf import PdfReader
        except ImportError:
            return None

        try:
            reader = PdfReader(str(path))
            pages = []
            for index, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                if text.strip():
                    pages.append(f"<!-- page: {index} -->\n{text.strip()}")
        except Exception:
            return None

        return ParsedDocument(
            filename=path.name,
            normalized_markdown="\n\n".join(pages),
            metadata={"parser": "pypdf", "extension": ".pdf", "pages": len(reader.pages)},
        )

    def _parse_with_docling(self, path: Path) -> ParsedDocument:
        try:
            from docling.document_converter import DocumentConverter
        except ImportError as exc:
            raise RuntimeError("解析该文件需要安装 docling") from exc

        converter = DocumentConverter()
        result = converter.convert(str(path))
        document = result.document

        if hasattr(document, "export_to_markdown"):
            markdown = document.export_to_markdown()
        elif hasattr(document, "export_to_text"):
            markdown = document.export_to_text()
        else:
            markdown = str(document)

        return ParsedDocument(
            filename=path.name,
            normalized_markdown=markdown,
            metadata={"parser": "docling", "extension": path.suffix.lower()},
        )

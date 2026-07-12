from pathlib import Path
from typing import List

from pypdf import PdfReader


class PdfLoader:
    def find_pdfs(self, directory: Path) -> List[Path]:
        if not directory.exists():
            return []
        return sorted([path for path in directory.glob("*.pdf") if path.is_file()])

    def extract_text_from_pdf(self, path: Path) -> str:
        reader = PdfReader(path)
        pages = []
        for page_number, page in enumerate(reader.pages, start=1):
            try:
                pages.append(page.extract_text() or "")
            except Exception:
                continue
        return "\n".join(pages).strip()

    def split_text_into_chunks(
        self,
        text: str,
        min_words: int = 300,
        max_words: int = 500,
    ) -> List[str]:
        normalized = " ".join(text.replace("\n", " ").split())
        if not normalized:
            return []

        words = normalized.split(" ")
        chunks = []
        current_chunk = []

        for word in words:
            current_chunk.append(word)
            if len(current_chunk) >= max_words:
                chunks.append(" ".join(current_chunk))
                current_chunk = []

        if current_chunk:
            if chunks and len(current_chunk) < min_words:
                chunks[-1] = " ".join(chunks[-1].split() + current_chunk)
            else:
                chunks.append(" ".join(current_chunk))

        return chunks

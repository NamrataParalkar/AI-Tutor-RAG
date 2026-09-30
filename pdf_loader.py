from pathlib import Path
from typing import List
import logging

logging.getLogger("pypdf").setLevel(logging.ERROR)

try:
    import pymupdf
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

if not HAS_PYMUPDF:
    try:
        from pypdf import PdfReader
    except ImportError:
        pass


class PdfLoader:
    def find_pdfs(self, directory: Path) -> List[Path]:
        if not directory.exists():
            return []
        return sorted([path for path in directory.glob("*.pdf") if path.is_file()])

    def extract_text_from_pdf(self, path: Path) -> str:
        # Fast C++ path with PyMuPDF
        if HAS_PYMUPDF:
            try:
                doc = pymupdf.open(str(path))
                pages = []
                for page in doc:
                    txt = page.get_text()
                    if txt:
                        pages.append(txt)
                doc.close()
                return "\n".join(pages).strip()
            except Exception as e:
                print(f"PyMuPDF error reading {path}: {e}. Falling back to pypdf.")

        # Fallback path with pypdf
        try:
            from pypdf import PdfReader
            reader = PdfReader(str(path))
            pages = []
            for page in reader.pages:
                try:
                    text = page.extract_text()
                    if text:
                        pages.append(text)
                except Exception:
                    continue
            return "\n".join(pages).strip()
        except Exception as e:
            print(f"Error reading PDF {path}: {e}")
            return ""

    def split_text_into_chunks(
        self,
        text: str,
        min_words: int = 250,
        max_words: int = 450,
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

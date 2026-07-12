from pathlib import Path
import textwrap
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator

from embedding_service import EmbeddingService
from llm_service import LLMService
from pdf_loader import PdfLoader
from vector_store import VectorStore

DATA_DIR = Path(__file__).parent / "data"


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1)
    mode: Optional[str] = "normal"

    @validator("mode")
    def validate_mode(cls, value: str) -> str:
        if value not in ("simple", "normal", "hint"):
            raise ValueError("mode must be 'simple', 'normal', or 'hint'")
        return value


class AskResponse(BaseModel):
    answer: str


app = FastAPI(title="AI Tutor Bot")

pdf_loader = PdfLoader()
embedding_service = EmbeddingService()
vector_store = VectorStore(embedding_service.embedding_dim)
llm_service = LLMService()


@app.get("/")
def welcome() -> dict:
    return {
        "message": "Welcome to AI Tutor Bot",
        "description": "A Retrieval-Augmented Generation (RAG) powered educational assistant",
        "endpoints": {
            "POST /ask": "Ask a question about your study materials"
        },
        "modes": ["simple", "normal", "hint"]
    }


@app.on_event("startup")
def startup_event() -> None:
    pdf_paths = pdf_loader.find_pdfs(DATA_DIR)
    text_chunks = []

    for path in pdf_paths:
        try:
            raw_text = pdf_loader.extract_text_from_pdf(path)
            chunks = pdf_loader.split_text_into_chunks(raw_text)
            for idx, chunk in enumerate(chunks, start=1):
                text_chunks.append({
                    "text": chunk,
                    "source": f"{path.name} [chunk {idx}]",
                })
        except Exception as exc:
            print(f"Warning: failed to load {path}: {exc}")

    if not text_chunks:
        print("Warning: no study material loaded. Add PDF files to the data directory.")
        return

    embeddings = embedding_service.embed_texts([item["text"] for item in text_chunks])
    metadatas = [
        {"source": item["source"], "text": item["text"]}
        for item in text_chunks
    ]
    vector_store.add_embeddings(embeddings, metadatas)
    print(f"Loaded {len(text_chunks)} chunks from {len(pdf_paths)} PDF(s).")


@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    if vector_store.size == 0:
        raise HTTPException(
            status_code=503,
            detail="No study materials are available for retrieval. Place PDFs in the data directory and restart the app.",
        )

    try:
        query_embedding = embedding_service.embed_query(request.question)
        results = vector_store.search(query_embedding, top_k=3)

        if not results:
            raise HTTPException(
                status_code=404,
                detail="No relevant information was found for the submitted question.",
            )

        context_snippets = []
        for result in results:
            source = result["metadata"]["source"]
            excerpt = textwrap.shorten(result["metadata"]["text"], width=500, placeholder="...")
            context_snippets.append(f"{source}: {excerpt}")

        answer = llm_service.generate_answer(
            question=request.question,
            context_chunks=context_snippets,
            mode=request.mode,
        )

        return AskResponse(answer=answer.strip())
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}")

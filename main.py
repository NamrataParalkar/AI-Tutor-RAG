import json
import os
import shutil
import textwrap
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from embedding_service import EmbeddingService
from llm_service import LLMService
from pdf_loader import PdfLoader
from vector_store import VectorStore

load_dotenv()

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
CACHE_EMBEDDINGS_FILE = DATA_DIR / "cache_embeddings.npy"
CACHE_METADATA_FILE = DATA_DIR / "cache_metadata.json"

app = FastAPI(
    title="AI Tutor Copilot API",
    description="Intelligent RAG Educational Assistant with Multi-Mode Tutoring, Quizzes, and Source Citations",
    version="2.0.0",
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount frontend assets if dist exists
if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

pdf_loader = PdfLoader()
embedding_service = EmbeddingService()
vector_store = VectorStore(embedding_service.embedding_dim)
llm_service = LLMService()


# Pydantic Schemas
class AskRequest(BaseModel):
    question: str = Field(..., min_length=1)
    mode: Optional[str] = "normal"
    top_k: Optional[int] = 4


class SourceItem(BaseModel):
    source: str
    excerpt: str
    score: float


class AskResponse(BaseModel):
    answer: str
    sources: List[SourceItem] = []
    mode: str = "normal"
    suggested_followups: List[str] = []


class QuizRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    count: Optional[int] = 3


class FlashcardRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    count: Optional[int] = 4


def save_index_cache(embeddings: List[List[float]], metadatas: List[Dict[str, Any]]) -> None:
    try:
        np.save(CACHE_EMBEDDINGS_FILE, np.array(embeddings, dtype="float32"))
        with open(CACHE_METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump(metadatas, f, ensure_ascii=False)
        print("Cached vector index to disk successfully.")
    except Exception as e:
        print(f"Warning: could not save index cache: {e}")


def load_index_cache() -> bool:
    if CACHE_EMBEDDINGS_FILE.exists() and CACHE_METADATA_FILE.exists():
        try:
            embeddings_array = np.load(CACHE_EMBEDDINGS_FILE)
            with open(CACHE_METADATA_FILE, "r", encoding="utf-8") as f:
                metadatas = json.load(f)

            if len(embeddings_array) == len(metadatas) and len(embeddings_array) > 0:
                vector_store.clear()
                vector_store.add_embeddings(embeddings_array.tolist(), metadatas)
                print(f"Loaded {vector_store.size} cached vector chunks instantly!")
                return True
        except Exception as e:
            print(f"Cache load failed: {e}. Will rebuild index.")
    return False


def build_index() -> int:
    pdf_paths = pdf_loader.find_pdfs(DATA_DIR)
    text_chunks: List[Dict[str, str]] = []

    for path in pdf_paths:
        try:
            raw_text = pdf_loader.extract_text_from_pdf(path)
            chunks = pdf_loader.split_text_into_chunks(raw_text)
            for idx, chunk in enumerate(chunks, start=1):
                text_chunks.append({
                    "text": chunk,
                    "source": f"{path.name} [chunk {idx}]",
                    "filename": path.name,
                })
        except Exception as exc:
            print(f"Warning: failed to load {path}: {exc}")

    if not text_chunks:
        print("Warning: no study material found in data directory.")
        return 0

    print(f"Embedding {len(text_chunks)} text chunks with {embedding_service.provider}...")
    embeddings = embedding_service.embed_texts([item["text"] for item in text_chunks])
    metadatas = [
        {"source": item["source"], "text": item["text"], "filename": item.get("filename", "")}
        for item in text_chunks
    ]

    vector_store.clear()
    vector_store.add_embeddings(embeddings, metadatas)
    save_index_cache(embeddings, metadatas)
    print(f"Successfully indexed {len(text_chunks)} chunks from {len(pdf_paths)} document(s).")
    return len(text_chunks)


@app.on_event("startup")
def startup_event() -> None:
    if not load_index_cache():
        build_index()


@app.get("/")
def index_or_welcome():
    # If production build index.html exists, serve React UI
    index_html = FRONTEND_DIST / "index.html"
    if index_html.exists():
        return FileResponse(str(index_html))
    return {
        "message": "AI Tutor Copilot API is running",
        "description": "Enterprise-grade RAG backend with multi-mode tutoring, citations, and practice tools",
        "loaded_chunks": vector_store.size,
        "llm_provider": llm_service.provider,
        "embedding_provider": embedding_service.provider,
    }


@app.get("/api")
def api_welcome() -> dict:
    return {
        "message": "AI Tutor Copilot API is active",
        "loaded_chunks": vector_store.size,
        "llm_provider": llm_service.provider,
        "embedding_provider": embedding_service.provider,
    }


@app.get("/api/status")
def get_status() -> dict:
    pdf_paths = pdf_loader.find_pdfs(DATA_DIR)
    docs = []
    for p in pdf_paths:
        docs.append({
            "name": p.name,
            "size_kb": round(p.stat().st_size / 1024, 1),
            "size_mb": round(p.stat().st_size / (1024 * 1024), 2),
            "modified": int(p.stat().st_mtime),
        })

    return {
        "status": "ready" if vector_store.size > 0 else "empty",
        "documents": docs,
        "total_chunks": vector_store.size,
        "vector_dim": vector_store.dimension,
        "llm_provider": llm_service.provider,
        "embedding_provider": embedding_service.provider,
        "available_modes": [
            {"id": "normal", "name": "Normal Tutor", "desc": "Standard clear teaching style with structured explanations and examples"},
            {"id": "simple", "name": "Explain Like I'm 10", "desc": "Simple everyday analogies, intuitive breakdowns, no jargon"},
            {"id": "hint", "name": "Socratic Hint Mode", "desc": "Guiding questions & clues to help you think through the problem yourself"},
            {"id": "deep", "name": "In-Depth Academic", "desc": "Comprehensive analysis with formulas, principles, and rigorous proofs"},
        ],
        "starter_prompts": [
            {"category": "Physics", "prompt": "Explain Newton's Three Laws of Motion with real-life examples."},
            {"category": "Biology", "prompt": "Why is the cell called the fundamental structural unit of life?"},
            {"category": "Chemistry", "prompt": "What is the difference between mixtures and pure substances?"},
            {"category": "Mathematics", "prompt": "How do you find the zeroes of a polynomial?"},
        ],
    }


@app.get("/api/documents")
def list_documents() -> dict:
    pdf_paths = pdf_loader.find_pdfs(DATA_DIR)
    return {
        "documents": [
            {
                "name": p.name,
                "size_mb": round(p.stat().st_size / (1024 * 1024), 2),
                "size_kb": round(p.stat().st_size / 1024, 1),
            }
            for p in pdf_paths
        ]
    }


@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)) -> dict:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    dest_path = DATA_DIR / file.filename
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Incrementally process new document
        raw_text = pdf_loader.extract_text_from_pdf(dest_path)
        chunks = pdf_loader.split_text_into_chunks(raw_text)
        if not chunks:
            raise HTTPException(status_code=400, detail="Could not extract readable text from PDF.")

        new_embeddings = embedding_service.embed_texts(chunks)
        new_metadatas = [
            {"source": f"{file.filename} [chunk {i+1}]", "text": chunk, "filename": file.filename}
            for i, chunk in enumerate(chunks)
        ]

        vector_store.add_embeddings(new_embeddings, new_metadatas)

        # Update disk cache
        all_embeddings = vector_store.embeddings_matrix.tolist()
        save_index_cache(all_embeddings, vector_store.metadatas)

        return {
            "message": f"Successfully uploaded and indexed '{file.filename}'",
            "chunks_added": len(chunks),
            "total_chunks": vector_store.size,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to process uploaded file: {exc}")


@app.post("/api/rebuild-index")
def rebuild_index() -> dict:
    total = build_index()
    return {"message": "Index rebuilt successfully", "total_chunks": total}


@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    if vector_store.size == 0:
        raise HTTPException(
            status_code=503,
            detail="No study materials are loaded. Place PDFs in the data directory or upload via the UI.",
        )

    try:
        query_embedding = embedding_service.embed_query(request.question)
        top_k = request.top_k or 4
        results = vector_store.search(query_embedding, top_k=top_k)

        if not results:
            raise HTTPException(
                status_code=404,
                detail="No relevant information was found for the submitted question.",
            )

        context_snippets = []
        sources: List[SourceItem] = []

        for result in results:
            src = result["metadata"].get("source", "Study Material")
            raw_chunk = result["metadata"].get("text", "")
            excerpt = textwrap.shorten(raw_chunk, width=320, placeholder="...")
            context_snippets.append(f"[{src}]:\n{raw_chunk}")
            sources.append(SourceItem(
                source=src,
                excerpt=excerpt,
                score=round(float(result.get("score", 0.0)), 3),
            ))

        answer = llm_service.generate_answer(
            question=request.question,
            context_chunks=context_snippets,
            mode=request.mode or "normal",
        )

        suggested_followups = [
            f"Can you give an everyday example of this?",
            f"What are the common exam questions on this topic?",
            f"Test my understanding with a practice problem!",
        ]

        return AskResponse(
            answer=answer.strip(),
            sources=sources,
            mode=request.mode or "normal",
            suggested_followups=suggested_followups,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}")


@app.post("/api/quiz")
def generate_quiz(request: QuizRequest) -> dict:
    if vector_store.size == 0:
        raise HTTPException(status_code=503, detail="No study material indexed.")

    query_embedding = embedding_service.embed_query(request.topic)
    results = vector_store.search(query_embedding, top_k=4)
    context_chunks = [r["metadata"].get("text", "") for r in results]
    questions = llm_service.generate_quiz(request.topic, context_chunks, count=request.count or 3)
    return {"topic": request.topic, "questions": questions}


@app.post("/api/flashcards")
def generate_flashcards(request: FlashcardRequest) -> dict:
    if vector_store.size == 0:
        raise HTTPException(status_code=503, detail="No study material indexed.")

    query_embedding = embedding_service.embed_query(request.topic)
    results = vector_store.search(query_embedding, top_k=4)
    context_chunks = [r["metadata"].get("text", "") for r in results]
    cards = llm_service.generate_flashcards(request.topic, context_chunks, count=request.count or 4)
    return {"topic": request.topic, "flashcards": cards}

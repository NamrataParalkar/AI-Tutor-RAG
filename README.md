# 🎓 AI Tutor Copilot — RAG 2.0

An enterprise-grade, Retrieval-Augmented Generation (RAG) educational companion designed for school and college curricula (pre-loaded with official Class 9 Mathematics & Science NCERT materials).

Features a professional **React UI** with glassmorphism aesthetics, multi-mode Socratic tutoring, retrieved textbook citations, interactive quizzes, 3D flip flashcards, and instant PDF knowledge-base uploads.

---

## 🌟 Key Features

1. **Rich Modern React Frontend**:
   - **Vanilla CSS Design System**: Sleek dark and light themes with glowing gradients, glassmorphism (`backdrop-filter: blur`), floating badges, and smooth micro-animations.
   - **Typography**: Google Fonts (*Plus Jakarta Sans* & *JetBrains Mono*).
   - **Markdown & Math Rendering**: Full syntax highlighting, tables, bullet points, blockquotes, and formula formatting with `react-markdown` and `remark-gfm`.

2. **Multi-Mode Tutoring Engine**:
   - 🎓 **Normal Tutor**: Comprehensive, structured teaching with practical examples.
   - 🧒 **Explain Like I'm 10**: Friendly everyday analogies, intuitive breakdowns, no jargon.
   - 💡 **Socratic Hint Mode**: Guiding questions and subtle clues to help students solve problems on their own.
   - 🔬 **In-Depth Academic**: Rigorous mathematical derivations, formulas, and deep textbook explanations.

3. **Grounded RAG & Source Citations**:
   - Real-time semantic similarity matching across 437 pre-indexed textbook chunks.
   - Clickable **Source Citations** with match confidence percentages and expandable context excerpts showing the exact textbook passages used.
   - Suggested follow-up prompt chips for frictionless continuous learning.

4. **Interactive Practice & Revision Tools**:
   - ⚡ **Interactive Practice Quiz**: Generates multiple-choice questions on any topic, complete with instant option feedback, hints, textbook explanations, and a celebratory confetti burst (`canvas-confetti`)!
   - 🗂️ **3D Flip Flashcards**: High-yield revision cards that flip in 3D perspective to test concept retention.
   - 🔖 **Study Notes & Bookmarks**: Save key tutor explanations, search through them, and export them directly to a Markdown revision sheet.
   - 📚 **Knowledge Base & Drag-and-Drop Uploader**: Upload any new PDF study material to index and expand the tutor's knowledge base dynamically!

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Environment Setup
Create or update your `.env` file in the project root:
```env
OPENAI_API_KEY=your_gemini_api_key_or_openai_key
```
*(The system automatically detects Google Gemini keys starting with `AIzaSy` or standard OpenAI `sk-` keys).*

### 3. Backend Setup
```powershell
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Run FastAPI backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend runs on **`http://127.0.0.1:8000`**.

### 4. React Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

*(Alternatively, the compiled production bundle is also served directly by FastAPI at `http://127.0.0.1:8000`).*

---

## 🏗️ Architecture

```
AI Tutor 3/
├── data/                               # Curriculum PDFs & indexed embeddings
│   ├── Mathematics---Class-9.pdf
│   ├── Science-Class-9.pdf
│   ├── cache_embeddings.npy            # Precomputed vector cache (<0.05s startup)
│   └── cache_metadata.json
├── frontend/                           # Professional React Application (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Mode switchers, status pill, tool triggers
│   │   │   ├── Sidebar.jsx             # Active documents, question starters, telemetry
│   │   │   ├── ChatArea.jsx            # Hero screen, markdown bubbles, citations, composer
│   │   │   ├── QuizModal.jsx           # Interactive MCQ quiz with confetti
│   │   │   ├── FlashcardsModal.jsx     # 3D Flip revision cards
│   │   │   ├── KnowledgeBaseModal.jsx  # Drag & Drop PDF uploader & library
│   │   │   └── StudyNotesModal.jsx     # Saved bookmarks & markdown exporter
│   │   ├── App.jsx                     # Master state controller
│   │   ├── App.css                     # Component layouts and glassmorphism styling
│   │   ├── index.css                   # Design tokens, typography, CSS variables
│   │   └── main.jsx
│   └── package.json
├── embedding_service.py                # High-speed semantic vectorizer
├── llm_service.py                      # Multi-provider LLM (Gemini 2.5 Flash / OpenAI / Ollama)
├── pdf_loader.py                       # High-speed PyMuPDF extractor with PyPDF fallback
├── vector_store.py                     # FAISS + NumPy FlatIP Cosine Similarity Engine
├── main.py                             # FastAPI backend with CORS, caching, and RAG routes
└── requirements.txt
```

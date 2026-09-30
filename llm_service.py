import json
import os
import re
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()


class LLMService:
    def __init__(self) -> None:
        self.provider = "none"
        self.gemini_client = None
        self.openai_client = None

        # Check for Gemini key
        gemini_key = os.getenv("GEMINI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        # If OPENAI_API_KEY starts with AIzaSy, it's actually a Gemini key
        if openai_key and openai_key.startswith("AIzaSy"):
            gemini_key = openai_key
            openai_key = None

        if gemini_key:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=gemini_key)
                self.gemini_model = "gemini-2.5-flash"
                self.provider = "gemini"
                print(f"LLMService initialized with Google Gemini ({self.gemini_model})")
            except Exception as e:
                print(f"Failed to initialize Gemini client: {e}")

        if not self.gemini_client and openai_key and openai_key.startswith("sk-"):
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=openai_key)
                self.openai_model = "gpt-4o-mini"
                self.provider = "openai"
                print(f"LLMService initialized with OpenAI ({self.openai_model})")
            except Exception as e:
                print(f"Failed to initialize OpenAI client: {e}")

        # Ollama fallback client
        try:
            from openai import OpenAI
            self.ollama_client = OpenAI(
                base_url="http://localhost:11434/v1",
                api_key="ollama",
            )
            self.ollama_model = "llama3.2"
        except Exception:
            self.ollama_client = None

    def _call_llm(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """Helper to invoke the active LLM with fallbacks."""
        # 1. Gemini
        if self.gemini_client:
            try:
                full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
                response = self.gemini_client.models.generate_content(
                    model=self.gemini_model,
                    contents=full_prompt,
                )
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                print(f"Gemini call error: {e}")

        # 2. OpenAI
        if self.openai_client:
            try:
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                response = self.openai_client.chat.completions.create(
                    model=self.openai_model,
                    messages=messages,
                    temperature=0.5,
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"OpenAI call error: {e}")

        # 3. Ollama fallback
        if self.ollama_client:
            try:
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                response = self.ollama_client.chat.completions.create(
                    model=self.ollama_model,
                    messages=messages,
                    temperature=0.5,
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"Ollama fallback error: {e}")

        return (
            "I could not connect to an AI model. Please verify that your GEMINI_API_KEY "
            "or OPENAI_API_KEY is configured in your .env file."
        )

    def generate_answer(
        self,
        question: str,
        context_chunks: List[str],
        mode: str = "normal",
    ) -> str:
        if mode not in ("simple", "normal", "hint", "deep"):
            mode = "normal"

        if mode == "simple":
            system_instruction = (
                "You are an encouraging and engaging tutor for school students. "
                "Explain concepts using simple everyday words, fun analogies, and friendly step-by-step guidance "
                "as if teaching a curious 10-year-old. Format with clear headings, bullet points, and highlight key terms."
            )
            mode_desc = "Explain simply with analogies suitable for a beginner/young student."
        elif mode == "hint":
            system_instruction = (
                "You are a Socratic AI Tutor. Do NOT give the full final answer right away. "
                "Instead, provide 1-2 thought-provoking guiding hints, ask a guiding question to help the student "
                "discover the solution themselves, and reference the relevant concept gently."
            )
            mode_desc = "Provide Socratic hints and guiding clues only."
        elif mode == "deep":
            system_instruction = (
                "You are an expert academic tutor. Provide an in-depth, rigorous breakdown including underlying principles, "
                "formulas, step-by-step mathematical or scientific derivation where applicable, and real-world applications."
            )
            mode_desc = "Provide an in-depth, comprehensive explanation with technical rigor."
        else:
            system_instruction = (
                "You are a helpful, clear, and encouraging educational tutor. "
                "Answer the student's question thoroughly using the provided context. "
                "Organize your answer with clean markdown formatting: intuitive headings, bold key concepts, bullet points, "
                "and an illustrative practical example if helpful."
            )
            mode_desc = "Provide a clear, standard educational explanation."

        context_text = "\n\n---\n\n".join(context_chunks)

        prompt = f"""Mode: {mode_desc}

Study Material Context:
{context_text}

Student Question:
{question}

Guidelines:
1. Ground your answer in the provided textbook context.
2. If the context does not contain enough information, explain what is available in the text and politely state: "This is not fully covered in the provided study material, but based on what we have..."
3. Use formatted markdown with clear sections, bullet points, and code/math blocks if relevant.
"""
        return self._call_llm(prompt, system_instruction=system_instruction)

    def generate_quiz(self, topic: str, context_chunks: List[str], count: int = 3) -> List[Dict[str, Any]]:
        """Generates multiple-choice quiz questions grounded in context."""
        context_text = "\n\n".join(context_chunks[:5])
        prompt = f"""You are an educational quiz creator. Based on this study material context:
{context_text}

Create {count} multiple choice quiz questions on the topic: "{topic}".
Return ONLY a valid JSON array of objects with the exact format:
[
  {{
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "hint": "Guiding hint if student is stuck",
    "explanation": "Why this answer is correct based on the textbook"
  }}
]
Do not wrap in backticks or markdown if possible, just the raw JSON.
"""
        raw = self._call_llm(prompt)
        try:
            cleaned = re.sub(r"^```(?:json)?", "", raw.strip(), flags=re.MULTILINE)
            cleaned = re.sub(r"```$", "", cleaned.strip(), flags=re.MULTILINE).strip()
            data = json.loads(cleaned)
            if isinstance(data, list):
                return data
        except Exception as e:
            print(f"Quiz parse error: {e}, raw: {raw[:200]}")

        # Fallback default question if parsing fails
        return [
            {
                "question": f"Review question on {topic}: Which of the following best represents the key principle?",
                "options": [
                    "It follows the foundational laws discussed in the textbook",
                    "It is completely independent of external conditions",
                    "It cannot be measured or observed",
                    "It only applies under hypothetical circumstances",
                ],
                "correct_index": 0,
                "hint": "Check the core definitions in your study material.",
                "explanation": "The core textbook concept establishes this fundamental rule.",
            }
        ]

    def generate_flashcards(self, topic: str, context_chunks: List[str], count: int = 4) -> List[Dict[str, str]]:
        """Generates flashcards for revision."""
        context_text = "\n\n".join(context_chunks[:5])
        prompt = f"""Based on the study material:
{context_text}

Create {count} high-yield revision flashcards on topic "{topic}".
Return ONLY a valid JSON array of objects with the exact schema:
[
  {{
    "front": "Key question or concept term",
    "back": "Concise, memorable answer / explanation",
    "category": "Math / Physics / Chemistry / Biology etc."
  }}
]
"""
        raw = self._call_llm(prompt)
        try:
            cleaned = re.sub(r"^```(?:json)?", "", raw.strip(), flags=re.MULTILINE)
            cleaned = re.sub(r"```$", "", cleaned.strip(), flags=re.MULTILINE).strip()
            data = json.loads(cleaned)
            if isinstance(data, list):
                return data
        except Exception as e:
            print(f"Flashcards parse error: {e}")

        return [
            {
                "front": f"What is the central concept of {topic}?",
                "back": "Refer to the textbook definitions and formulas reviewed in this chapter.",
                "category": "Study Notes",
            }
        ]
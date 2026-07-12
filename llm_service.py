import os
from typing import List
from openai import OpenAI


class LLMService:
    def __init__(self) -> None:
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            self.openai_client = OpenAI(api_key=self.openai_api_key)
        else:
            self.openai_client = None
        self.model = "gpt-4o-mini"
        self.fallback_client = OpenAI(
            base_url="http://localhost:11434/v1",
            api_key="ollama"  # Ollama doesn't require a real key
        )
        self.fallback_model = "llama3.2"

    def generate_answer(
        self,
        question: str,
        context_chunks: List[str],
        mode: str = "normal",
    ) -> str:
        if mode not in ("simple", "normal", "hint"):
            mode = "normal"

        instruction = (
            "You are a friendly tutor. Answer the question using ONLY the provided context. "
            "Provide a complete and accurate response based on the material, while keeping the language clear and easy to understand. "
            "Include a small example if helpful. "
        )

        if mode == "simple":
            tone = "Explain like you are teaching a 10-year-old. Use simple words and complete the answer fully."
        elif mode == "hint":
            tone = "Provide a helpful hint to guide the student towards the answer, without giving it away directly."
            instruction = (
                "You are a friendly tutor. Provide a hint using the provided context. "
                "Keep the hint short and guiding, don't give the full answer. "
            )
        else:
            tone = "Explain in a clear, standard teaching style. Provide the full answer based on the provided context."

        context_text = "\n\n".join(context_chunks)

        prompt = f"""
{instruction}
{tone}

Context:
{context_text}

Question:
{question}

If the answer is not in the context, say: "I don't know based on the provided material."
"""

        # Try OpenAI first
        openai_error = None
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.5,
                    max_tokens=500,
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                openai_error = e
                error_str = str(e).lower()
                if "insufficient_quota" in error_str or "429" in error_str or "invalid_api_key" in error_str or "401" in error_str:
                    # If OpenAI fails because of quota or auth issues, fallback to Ollama
                    pass
                else:
                    # If OpenAI fails for any other reason, still attempt fallback
                    pass

        # Fallback to Ollama
        try:
            response = self.fallback_client.chat.completions.create(
                model=self.fallback_model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=500,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            if openai_error:
                return (
                    f"OpenAI failed: {str(openai_error)}. "
                    f"Fallback with Ollama also failed: {str(e)}. "
                    "Please ensure Ollama is installed, running, and that the llama3.2 model is pulled."
                )
            return f"Error generating response with fallback LLM: {str(e)}. Please ensure Ollama is installed and running with 'llama3.2' model."
import hashlib
from typing import List, Sequence
import numpy as np

try:
    from sklearn.feature_extraction.text import HashingVectorizer
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False


class EmbeddingService:
    def __init__(self, embedding_dim: int = 1024) -> None:
        self.embedding_dim = embedding_dim
        self.provider = "hashing-vectorizer" if HAS_SKLEARN else "hash-fallback"

        if HAS_SKLEARN:
            self.vectorizer = HashingVectorizer(
                n_features=self.embedding_dim,
                stop_words="english",
                alternate_sign=False,
                norm="l2",
            )
        else:
            self.vectorizer = None

        print(f"EmbeddingService initialized with provider: {self.provider} (dimension: {self.embedding_dim})")

    def _fallback_hash(self, text: str) -> List[float]:
        vec = np.zeros(self.embedding_dim, dtype="float32")
        words = text.lower().split()
        if not words:
            return vec.tolist()
        for word in words:
            idx = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16) % self.embedding_dim
            vec[idx] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def embed_texts(self, texts: Sequence[str]) -> List[List[float]]:
        if not texts:
            return []

        if HAS_SKLEARN and self.vectorizer:
            try:
                matrix = self.vectorizer.transform(texts).toarray().astype("float32")
                return matrix.tolist()
            except Exception as e:
                print(f"Error in embed_texts: {e}")

        return [self._fallback_hash(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        if not text:
            return [0.0] * self.embedding_dim

        if HAS_SKLEARN and self.vectorizer:
            try:
                matrix = self.vectorizer.transform([text]).toarray().astype("float32")
                return matrix[0].tolist()
            except Exception as e:
                print(f"Error in embed_query: {e}")

        return self._fallback_hash(text)

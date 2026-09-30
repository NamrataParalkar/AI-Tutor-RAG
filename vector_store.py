from typing import Any, Dict, List, Sequence
import numpy as np

try:
    import faiss
    HAS_FAISS = True
except Exception:
    HAS_FAISS = False


class VectorStore:
    def __init__(self, dimension: int) -> None:
        self.dimension = dimension
        self.metadatas: List[Dict[str, Any]] = []
        self.size = 0
        self.embeddings_matrix: np.ndarray = np.empty((0, dimension), dtype="float32")
        self.index = None
        if HAS_FAISS:
            try:
                self.index = faiss.IndexFlatIP(dimension)
            except Exception:
                self.index = None

    @staticmethod
    def _normalize(vectors: Sequence[Sequence[float]]) -> np.ndarray:
        array = np.asarray(vectors, dtype="float32")
        if array.ndim == 1:
            array = array.reshape(1, -1)
        norms = np.linalg.norm(array, axis=1, keepdims=True)
        norms[norms == 0.0] = 1.0
        return array / norms

    def add_embeddings(
        self,
        embeddings: Sequence[Sequence[float]],
        metadatas: Sequence[Dict[str, Any]],
    ) -> None:
        if len(embeddings) != len(metadatas):
            raise ValueError("Embeddings and metadata length must match.")

        normalized = self._normalize(embeddings)
        if normalized.shape[1] != self.dimension:
            raise ValueError(
                f"Expected embeddings of dimension {self.dimension}, got {normalized.shape[1]}"
            )

        if self.index is not None:
            try:
                self.index.add(normalized)
            except Exception:
                self.index = None

        if self.embeddings_matrix.shape[0] == 0:
            self.embeddings_matrix = normalized
        else:
            self.embeddings_matrix = np.vstack([self.embeddings_matrix, normalized])

        self.metadatas.extend(metadatas)
        self.size = len(self.metadatas)

    def search(self, query_embedding: Sequence[float], top_k: int = 3) -> List[Dict[str, Any]]:
        if self.size == 0 or not query_embedding:
            return []

        normalized_query = self._normalize(query_embedding)
        k = min(top_k, self.size)

        if self.index is not None:
            try:
                distances, indices = self.index.search(normalized_query, k)
                results: List[Dict[str, Any]] = []
                for score, idx in zip(distances[0], indices[0]):
                    if idx < 0:
                        continue
                    results.append({
                        "score": float(score),
                        "metadata": self.metadatas[idx],
                    })
                return results
            except Exception:
                pass

        # High-performance NumPy cosine similarity fallback
        scores = np.dot(self.embeddings_matrix, normalized_query[0])
        top_indices = np.argsort(scores)[::-1][:k]
        results = []
        for idx in top_indices:
            results.append({
                "score": float(scores[idx]),
                "metadata": self.metadatas[idx],
            })
        return results

    def clear(self) -> None:
        self.metadatas = []
        self.size = 0
        self.embeddings_matrix = np.empty((0, self.dimension), dtype="float32")
        if self.index is not None:
            try:
                self.index.reset()
            except Exception:
                pass

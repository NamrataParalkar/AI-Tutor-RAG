from typing import Any, Dict, List, Sequence

import faiss
import numpy as np


class VectorStore:
    def __init__(self, dimension: int) -> None:
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)
        self.metadatas: List[Dict[str, Any]] = []
        self.size = 0

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

        self.index.add(normalized)
        self.metadatas.extend(metadatas)
        self.size = len(self.metadatas)

    def search(self, query_embedding: Sequence[float], top_k: int = 3) -> List[Dict[str, Any]]:
        if self.size == 0:
            return []

        normalized_query = self._normalize(query_embedding)
        k = min(top_k, self.size)
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

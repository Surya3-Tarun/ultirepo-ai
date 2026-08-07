"""
Embedding provider abstraction.

Default provider is local (sentence-transformers, free, no API key needed).
Swap to Gemini embeddings by setting EMBEDDING_PROVIDER=gemini in .env.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from functools import lru_cache

from app.config import get_settings

settings = get_settings()


class EmbeddingProvider(ABC):
    @abstractmethod
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        ...

    @abstractmethod
    def embed_query(self, text: str) -> list[float]:
        ...


class LocalSentenceTransformerProvider(EmbeddingProvider):
    """Free, local embeddings — no network calls, no API key required."""

    def __init__(self, model_name: str) -> None:
        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer(model_name)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._model.encode(texts, show_progress_bar=False, convert_to_numpy=True).tolist()

    def embed_query(self, text: str) -> list[float]:
        return self._model.encode([text], show_progress_bar=False, convert_to_numpy=True)[0].tolist()


class GeminiEmbeddingProvider(EmbeddingProvider):
    """Uses Google's text-embedding model via the Gemini API."""

    def __init__(self, api_key: str) -> None:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        self._genai = genai
        self._model_name = "models/text-embedding-004"

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self.embed_query(t) for t in texts]

    def embed_query(self, text: str) -> list[float]:
        result = self._genai.embed_content(model=self._model_name, content=text)
        return result["embedding"]


@lru_cache
def get_embedding_provider() -> EmbeddingProvider:
    if settings.embedding_provider == "gemini":
        if not settings.gemini_api_key:
            raise RuntimeError("EMBEDDING_PROVIDER=gemini requires GEMINI_API_KEY to be set.")
        return GeminiEmbeddingProvider(settings.gemini_api_key)
    return LocalSentenceTransformerProvider(settings.local_embedding_model)

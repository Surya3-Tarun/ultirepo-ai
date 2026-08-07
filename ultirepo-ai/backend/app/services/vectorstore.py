"""
Thin wrapper around ChromaDB, namespacing each repository into its own
collection so multiple indexed repos never collide.
"""
from __future__ import annotations

from dataclasses import dataclass

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import get_settings
from app.services.chunking import Chunk
from app.services.embeddings import get_embedding_provider

settings = get_settings()


@dataclass
class RetrievedChunk:
    content: str
    file_path: str
    start_line: int
    end_line: int
    relevance_score: float


class VectorStore:
    def __init__(self) -> None:
        self._client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )

    def _collection_name(self, repo_id: str) -> str:
        return f"repo_{repo_id}"

    def index_chunks(self, repo_id: str, chunks: list[Chunk]) -> int:
        collection = self._client.get_or_create_collection(self._collection_name(repo_id))
        if not chunks:
            return 0

        provider = get_embedding_provider()
        texts = [c.content for c in chunks]
        embeddings = provider.embed_documents(texts)

        collection.add(
            ids=[c.chunk_id for c in chunks],
            embeddings=embeddings,
            documents=texts,
            metadatas=[
                {
                    "file_path": c.file_path,
                    "language": c.language,
                    "start_line": c.start_line,
                    "end_line": c.end_line,
                }
                for c in chunks
            ],
        )
        return len(chunks)

    def query(self, repo_id: str, question: str, top_k: int) -> list[RetrievedChunk]:
        collection = self._client.get_or_create_collection(self._collection_name(repo_id))
        provider = get_embedding_provider()
        query_embedding = provider.embed_query(question)

        results = collection.query(query_embeddings=[query_embedding], n_results=top_k)
        if not results["ids"] or not results["ids"][0]:
            return []

        retrieved: list[RetrievedChunk] = []
        for doc, meta, distance in zip(
            results["documents"][0], results["metadatas"][0], results["distances"][0]
        ):
            # Chroma returns a distance; convert to an intuitive 0-1 relevance score.
            relevance = max(0.0, 1.0 - distance)
            retrieved.append(
                RetrievedChunk(
                    content=doc,
                    file_path=meta["file_path"],
                    start_line=meta.get("start_line", 0),
                    end_line=meta.get("end_line", 0),
                    relevance_score=round(relevance, 4),
                )
            )
        return retrieved

    def collection_stats(self, repo_id: str) -> dict:
        collection = self._client.get_or_create_collection(self._collection_name(repo_id))
        count = collection.count()
        return {"total_chunks": count}

    def delete_repo(self, repo_id: str) -> None:
        try:
            self._client.delete_collection(self._collection_name(repo_id))
        except Exception:
            pass


_vector_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store

"""
Orchestrates the full ingestion pipeline as a background task:
clone -> parse -> chunk -> embed -> index, reporting progress at each
stage through the JobManager (which drives both polling and WebSocket
updates on the Repository Processing page).
"""
from __future__ import annotations

from collections import Counter

from app.models.schemas import ProcessingStage
from app.services.chunking import chunk_repository
from app.services.job_manager import job_manager
from app.services.repo_ingestion import RepoIngestionError, clone_repository, walk_repository
from app.services.repo_registry import RepoMeta, get_repo_registry
from app.services.vectorstore import get_vector_store


async def run_ingestion(repo_id: str, repo_url: str, branch: str | None) -> None:
    try:
        await job_manager.update(repo_id, ProcessingStage.CLONING, 10, f"Cloning {repo_url} ...")
        repo_path = clone_repository(repo_url, repo_id, branch)

        await job_manager.update(repo_id, ProcessingStage.PARSING, 30, "Scanning repository files ...")
        repo_files = walk_repository(repo_path)
        if not repo_files:
            raise RepoIngestionError("No supported source or documentation files were found in this repository.")

        await job_manager.update(
            repo_id, ProcessingStage.CHUNKING, 50, f"Chunking {len(repo_files)} files ..."
        )
        chunks = chunk_repository(repo_files)

        await job_manager.update(
            repo_id, ProcessingStage.EMBEDDING, 70, f"Generating embeddings for {len(chunks)} chunks ..."
        )
        await job_manager.update(repo_id, ProcessingStage.INDEXING, 85, "Writing to vector index ...")
        vector_store = get_vector_store()
        indexed_count = vector_store.index_chunks(repo_id, chunks)

        languages = Counter(f.language for f in repo_files)
        largest_files = sorted(
            ({"path": f.relative_path, "size_bytes": f.size_bytes} for f in repo_files),
            key=lambda item: item["size_bytes"],
            reverse=True,
        )[:10]

        get_repo_registry().upsert(
            RepoMeta(
                repo_id=repo_id,
                repo_url=repo_url,
                total_files=len(repo_files),
                total_chunks=indexed_count,
                languages=dict(languages),
                largest_files=largest_files,
            )
        )

        await job_manager.update(
            repo_id, ProcessingStage.READY, 100, f"Indexed {len(repo_files)} files / {indexed_count} chunks."
        )

    except RepoIngestionError as exc:
        await job_manager.update(repo_id, ProcessingStage.ERROR, 0, "Ingestion failed", error=str(exc))
    except Exception as exc:  # noqa: BLE001 - surface unexpected errors gracefully, not as a stack trace
        await job_manager.update(
            repo_id, ProcessingStage.ERROR, 0, "Ingestion failed unexpectedly", error=str(exc)
        )

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.models.schemas import RepoStatsResponse
from app.services.repo_registry import get_repo_registry
from app.services.vectorstore import get_vector_store

router = APIRouter(tags=["stats"])


@router.get("/repo-stats/{repo_id}", response_model=RepoStatsResponse)
async def repo_stats(repo_id: str) -> RepoStatsResponse:
    meta = get_repo_registry().get(repo_id)
    if meta is None:
        raise HTTPException(status_code=404, detail="Repository not found. Has it finished indexing?")

    live_chunk_count = get_vector_store().collection_stats(repo_id)["total_chunks"]

    return RepoStatsResponse(
        repo_id=meta.repo_id,
        repo_url=meta.repo_url,
        total_files=meta.total_files,
        total_chunks=meta.total_chunks,
        total_embeddings=live_chunk_count,
        languages=meta.languages,
        largest_files=meta.largest_files,
        indexed_at=meta.indexed_at,
    )


@router.get("/repos")
async def list_repos() -> list[dict]:
    return [
        {"repo_id": m.repo_id, "repo_url": m.repo_url, "indexed_at": m.indexed_at, "total_files": m.total_files}
        for m in get_repo_registry().all()
    ]

from __future__ import annotations

from fastapi import APIRouter, Query

from app.services.history_store import list_history

router = APIRouter(tags=["history"])


@router.get("/search-history")
async def search_history(repo_id: str | None = Query(default=None), limit: int = Query(default=100, le=500)) -> list[dict]:
    return list_history(repo_id=repo_id, limit=limit)

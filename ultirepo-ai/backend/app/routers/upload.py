from __future__ import annotations

import hashlib
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.models.schemas import UploadRepoRequest, UploadRepoResponse
from app.services.ingestion_pipeline import run_ingestion

router = APIRouter(tags=["ingestion"])


def _repo_id_for(repo_url: str) -> str:
    # Deterministic short id so re-uploading the same repo reuses its namespace,
    # with a random suffix to still allow intentional re-indexing side by side.
    digest = hashlib.sha1(repo_url.encode()).hexdigest()[:10]
    return f"{digest}-{uuid.uuid4().hex[:6]}"


@router.post("/upload-repo", response_model=UploadRepoResponse)
async def upload_repo(payload: UploadRepoRequest, background_tasks: BackgroundTasks) -> UploadRepoResponse:
    if not payload.repo_url.strip():
        raise HTTPException(status_code=400, detail="repo_url is required")
    if not payload.repo_url.startswith(("https://github.com/", "http://github.com/", "git@github.com:")):
        raise HTTPException(status_code=400, detail="Only GitHub repository URLs are supported right now")

    repo_id = _repo_id_for(payload.repo_url)
    background_tasks.add_task(run_ingestion, repo_id, payload.repo_url, payload.branch)

    return UploadRepoResponse(
        repo_id=repo_id,
        message="Repository queued for cloning and indexing. Track progress via /process-status or the WebSocket channel.",
    )

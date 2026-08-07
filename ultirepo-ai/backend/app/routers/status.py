from __future__ import annotations

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from app.models.schemas import ProcessStatusResponse
from app.services.job_manager import job_manager

router = APIRouter(tags=["ingestion"])


@router.get("/process-status/{repo_id}", response_model=ProcessStatusResponse)
async def process_status(repo_id: str) -> ProcessStatusResponse:
    job = job_manager.get(repo_id)
    if job is None:
        raise HTTPException(status_code=404, detail="No processing job found for this repo_id")
    return ProcessStatusResponse(
        repo_id=job.repo_id,
        stage=job.stage,
        progress_percent=job.progress_percent,
        detail=job.detail,
        error=job.error,
    )


@router.websocket("/ws/process-status/{repo_id}")
async def process_status_ws(websocket: WebSocket, repo_id: str) -> None:
    await websocket.accept()
    queue = job_manager.subscribe(repo_id)

    # Immediately send current state, if any, so the client isn't stuck waiting.
    job = job_manager.get(repo_id)
    if job is not None:
        await websocket.send_json(
            {
                "repo_id": job.repo_id,
                "stage": job.stage.value,
                "progress_percent": job.progress_percent,
                "detail": job.detail,
                "error": job.error,
            }
        )

    try:
        while True:
            payload = await queue.get()
            await websocket.send_json(payload)
            if payload["stage"] in ("ready", "error"):
                break
    except WebSocketDisconnect:
        pass
    finally:
        job_manager.unsubscribe(repo_id, queue)

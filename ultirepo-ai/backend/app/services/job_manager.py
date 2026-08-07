"""
Tracks the live processing state of each repository ingestion job so that
/process-status (polling) and the WebSocket channel can both report progress
without duplicating state.
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Optional

from app.models.schemas import ProcessingStage


@dataclass
class JobState:
    repo_id: str
    stage: ProcessingStage = ProcessingStage.QUEUED
    progress_percent: int = 0
    detail: str = "Queued for processing"
    error: Optional[str] = None
    subscribers: list[asyncio.Queue] = field(default_factory=list)

    async def broadcast(self) -> None:
        payload = {
            "repo_id": self.repo_id,
            "stage": self.stage.value,
            "progress_percent": self.progress_percent,
            "detail": self.detail,
            "error": self.error,
        }
        for queue in list(self.subscribers):
            await queue.put(payload)


class JobManager:
    """Process-wide registry of ingestion jobs, keyed by repo_id."""

    def __init__(self) -> None:
        self._jobs: dict[str, JobState] = {}

    def create(self, repo_id: str) -> JobState:
        job = JobState(repo_id=repo_id)
        self._jobs[repo_id] = job
        return job

    def get(self, repo_id: str) -> Optional[JobState]:
        return self._jobs.get(repo_id)

    async def update(
        self,
        repo_id: str,
        stage: ProcessingStage,
        progress_percent: int,
        detail: str,
        error: Optional[str] = None,
    ) -> None:
        job = self._jobs.get(repo_id)
        if job is None:
            job = self.create(repo_id)
        job.stage = stage
        job.progress_percent = progress_percent
        job.detail = detail
        job.error = error
        await job.broadcast()

    def subscribe(self, repo_id: str) -> asyncio.Queue:
        job = self._jobs.get(repo_id) or self.create(repo_id)
        queue: asyncio.Queue = asyncio.Queue()
        job.subscribers.append(queue)
        return queue

    def unsubscribe(self, repo_id: str, queue: asyncio.Queue) -> None:
        job = self._jobs.get(repo_id)
        if job and queue in job.subscribers:
            job.subscribers.remove(queue)


# Singleton shared across the app (FastAPI app is single-process for this project)
job_manager = JobManager()

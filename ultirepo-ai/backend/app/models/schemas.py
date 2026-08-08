"""Shared Pydantic models for requests and responses across the API."""
from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ProcessingStage(str, Enum):
    QUEUED = "queued"
    CLONING = "cloning"
    PARSING = "parsing"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    INDEXING = "indexing"
    READY = "ready"
    ERROR = "error"


class UploadRepoRequest(BaseModel):
    repo_url: str = Field(..., description="Public GitHub repository URL to clone and index")
    branch: Optional[str] = Field(default=None, description="Branch to check out; defaults to repo default")


class UploadRepoResponse(BaseModel):
    repo_id: str
    message: str


class ProcessStatusResponse(BaseModel):
    repo_id: str
    stage: ProcessingStage
    progress_percent: int
    detail: str
    error: Optional[str] = None


class RepoStatsResponse(BaseModel):
    repo_id: str
    repo_url: str
    total_files: int
    total_chunks: int
    total_embeddings: int
    languages: dict[str, int]
    largest_files: list[dict]
    indexed_at: Optional[str] = None


class SourceCitation(BaseModel):
    file_path: str
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    snippet: str
    relevance_score: float


class ChatRequest(BaseModel):
    repo_id: str
    question: str
    session_id: Optional[str] = Field(default=None, description="Existing session id to keep conversation memory")
    top_k: Optional[int] = None


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    sources: list[SourceCitation]


class HistoryEntry(BaseModel):
    session_id: str
    repo_id: str
    question: str
    answer: str
    created_at: str


class HealthResponse(BaseModel):
    status: str
    llm_provider: str
    embedding_provider: str

from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest
from app.services.conversation_memory import get_conversation_memory
from app.services.history_store import record_turn
from app.services.rag_pipeline import answer_question
from app.services.repo_registry import get_repo_registry

router = APIRouter(tags=["chat"])


@router.post("/chat")
async def chat(payload: ChatRequest) -> StreamingResponse:
    if get_repo_registry().get(payload.repo_id) is None:
        raise HTTPException(status_code=404, detail="Repository not indexed yet. Upload and index it first.")
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="question is required")

    try:
        session_id, retrieved, stream = await answer_question(
            payload.repo_id, payload.question, payload.session_id, payload.top_k
        )
    except RuntimeError as exc:
        # e.g. missing API key - surface as a clean error, not a stack trace
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    async def event_stream():
        full_answer = ""
        try:
            async for piece in stream:
                full_answer += piece
                yield f"data: {json.dumps({'type': 'token', 'content': piece})}\n\n"
        except Exception as exc:  # noqa: BLE001
            yield f"data: {json.dumps({'type': 'error', 'content': str(exc)})}\n\n"
            return

        sources = [
            {
                "file_path": chunk.file_path,
                "start_line": chunk.start_line,
                "end_line": chunk.end_line,
                "snippet": chunk.content[:400],
                "relevance_score": chunk.relevance_score,
            }
            for chunk in retrieved
        ]
        yield f"data: {json.dumps({'type': 'sources', 'content': sources})}\n\n"
        yield f"data: {json.dumps({'type': 'session', 'content': session_id})}\n\n"
        yield "data: [DONE]\n\n"

        get_conversation_memory().get_or_create(session_id, payload.repo_id).add(
            payload.question, full_answer
        )
        record_turn(session_id, payload.repo_id, payload.question, full_answer)

    return StreamingResponse(event_stream(), media_type="text/event-stream")

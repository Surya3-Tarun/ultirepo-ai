"""
ULTIREPO AI backend entrypoint.

Run locally with:
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import chat, health, history, stats, status, upload

settings = get_settings()

app = FastAPI(
    title="ULTIREPO AI",
    description="An Intelligent GitHub Repository Q&A System Powered by Retrieval-Augmented Generation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Never leak raw stack traces to the client - always a clean, user-facing message.
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on the server. Please try again."},
    )


app.include_router(upload.router)
app.include_router(status.router)
app.include_router(stats.router)
app.include_router(chat.router)
app.include_router(history.router)
app.include_router(health.router)


@app.get("/")
async def root() -> dict:
    return {"message": "ULTIREPO AI backend is online. See /docs for the API reference."}

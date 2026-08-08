"""
Lightweight SQLite persistence for chat history, so past sessions survive
a server restart and can be listed/re-run from the Search History page.
"""
from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from app.config import get_settings

settings = get_settings()


def _init_db() -> None:
    Path(settings.history_db_path).parent.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                repo_id TEXT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )


@contextmanager
def _connect():
    conn = sqlite3.connect(settings.history_db_path)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def record_turn(session_id: str, repo_id: str, question: str, answer: str) -> None:
    _init_db()
    with _connect() as conn:
        conn.execute(
            "INSERT INTO history (session_id, repo_id, question, answer, created_at) VALUES (?, ?, ?, ?, ?)",
            (session_id, repo_id, question, answer, datetime.now(timezone.utc).isoformat()),
        )


def list_history(repo_id: str | None = None, limit: int = 100) -> list[dict]:
    _init_db()
    with _connect() as conn:
        conn.row_factory = sqlite3.Row
        if repo_id:
            rows = conn.execute(
                "SELECT * FROM history WHERE repo_id = ? ORDER BY id DESC LIMIT ?",
                (repo_id, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM history ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
        return [dict(row) for row in rows]

"""
Simple rolling-window conversation memory, keyed by session_id, so
follow-up questions about the same repository retain context without
needing a database round-trip on every turn.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field

MAX_TURNS_REMEMBERED = 6


@dataclass
class Turn:
    question: str
    answer: str


@dataclass
class Session:
    session_id: str
    repo_id: str
    turns: list[Turn] = field(default_factory=list)

    def add(self, question: str, answer: str) -> None:
        self.turns.append(Turn(question=question, answer=answer))
        if len(self.turns) > MAX_TURNS_REMEMBERED:
            self.turns.pop(0)

    def as_context(self) -> str:
        if not self.turns:
            return ""
        lines = []
        for turn in self.turns:
            lines.append(f"User: {turn.question}\nAssistant: {turn.answer}")
        return "\n\n".join(lines)


class ConversationMemoryStore:
    def __init__(self) -> None:
        self._sessions: dict[str, Session] = {}

    def get_or_create(self, session_id: str | None, repo_id: str) -> Session:
        if session_id and session_id in self._sessions:
            return self._sessions[session_id]
        new_id = session_id or str(uuid.uuid4())
        session = Session(session_id=new_id, repo_id=repo_id)
        self._sessions[new_id] = session
        return session


_store: ConversationMemoryStore | None = None


def get_conversation_memory() -> ConversationMemoryStore:
    global _store
    if _store is None:
        _store = ConversationMemoryStore()
    return _store

"""
The core question-answering pipeline: embed the query, retrieve the most
relevant chunks from ChromaDB, assemble them (plus rolling conversation
memory) into a system prompt, and stream the LLM's answer back alongside
the source citations that grounded it.
"""
from __future__ import annotations

from collections.abc import AsyncIterator

from app.config import get_settings
from app.services.conversation_memory import get_conversation_memory
from app.services.llm_client import get_llm_client
from app.services.vectorstore import RetrievedChunk, get_vector_store

settings = get_settings()

SYSTEM_PROMPT_TEMPLATE = """You are ULTIREPO AI, an expert assistant that answers questions about a \
specific GitHub repository using ONLY the retrieved code and documentation context provided below. \
Be precise, cite file paths naturally in your explanation, and say clearly when the retrieved context \
does not contain enough information to answer confidently instead of guessing.

Repository context (retrieved chunks):
{context}

Conversation so far (for follow-up questions):
{history}
"""


def _assemble_context(chunks: list[RetrievedChunk]) -> str:
    parts = []
    used_chars = 0
    for chunk in chunks:
        header = f"--- {chunk.file_path} (lines {chunk.start_line}-{chunk.end_line}) ---"
        block = f"{header}\n{chunk.content}"
        if used_chars + len(block) > settings.max_context_chars:
            break
        parts.append(block)
        used_chars += len(block)
    return "\n\n".join(parts) if parts else "(no matching context found)"


async def answer_question(
    repo_id: str, question: str, session_id: str | None, top_k: int | None
) -> tuple[str, list[RetrievedChunk], AsyncIterator[str]]:
    """
    Retrieves context and returns (session_id, retrieved_chunks, answer_stream).
    The caller is responsible for iterating answer_stream and, once complete,
    persisting the full answer into memory/history.
    """
    vector_store = get_vector_store()
    memory_store = get_conversation_memory()

    session = memory_store.get_or_create(session_id, repo_id)
    retrieved = vector_store.query(repo_id, question, top_k or settings.default_top_k)

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        context=_assemble_context(retrieved),
        history=session.as_context() or "(no prior turns)",
    )

    llm = get_llm_client()
    stream = llm.stream_answer(system_prompt, question)

    return session.session_id, retrieved, stream

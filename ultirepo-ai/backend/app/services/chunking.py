"""
Splits file contents into retrieval-sized chunks.

Uses LangChain's language-aware splitters where the language is recognized
(so functions/classes aren't split mid-body where avoidable), and falls back
to a recursive character splitter for prose/docs and unrecognized languages.
"""
from __future__ import annotations

from dataclasses import dataclass

from langchain.text_splitter import Language, RecursiveCharacterTextSplitter

from app.config import get_settings
from app.services.repo_ingestion import RepoFile

settings = get_settings()

_EXTENSION_TO_LANGCHAIN_LANGUAGE = {
    ".py": Language.PYTHON,
    ".js": Language.JS,
    ".jsx": Language.JS,
    ".ts": Language.TS,
    ".tsx": Language.TS,
    ".java": Language.JAVA,
    ".go": Language.GO,
    ".rb": Language.RUBY,
    ".rs": Language.RUST,
    ".php": Language.PHP,
    ".kt": Language.KOTLIN,
    ".cpp": Language.CPP,
    ".c": Language.C,
    ".cs": Language.CSHARP,
    ".md": Language.MARKDOWN,
}


@dataclass
class Chunk:
    chunk_id: str
    file_path: str
    language: str
    content: str
    start_line: int
    end_line: int


def _splitter_for(extension: str) -> RecursiveCharacterTextSplitter:
    lang = _EXTENSION_TO_LANGCHAIN_LANGUAGE.get(extension)
    if lang is not None:
        return RecursiveCharacterTextSplitter.from_language(
            language=lang, chunk_size=settings.chunk_size, chunk_overlap=settings.chunk_overlap
        )
    return RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", " ", ""],
    )


def chunk_file(repo_file: RepoFile) -> list[Chunk]:
    from pathlib import Path

    extension = Path(repo_file.relative_path).suffix.lower()
    splitter = _splitter_for(extension)
    pieces = splitter.split_text(repo_file.content)

    chunks: list[Chunk] = []
    cursor = 0
    for index, piece in enumerate(pieces):
        # Estimate line span by locating the piece within the original content.
        start_char = repo_file.content.find(piece, cursor)
        if start_char == -1:
            start_char = cursor
        end_char = start_char + len(piece)
        start_line = repo_file.content.count("\n", 0, start_char) + 1
        end_line = repo_file.content.count("\n", 0, end_char) + 1
        cursor = start_char + max(1, len(piece) - settings.chunk_overlap)

        chunks.append(
            Chunk(
                chunk_id=f"{repo_file.relative_path}::{index}",
                file_path=repo_file.relative_path,
                language=repo_file.language,
                content=piece,
                start_line=start_line,
                end_line=end_line,
            )
        )
    return chunks


def chunk_repository(repo_files: list[RepoFile]) -> list[Chunk]:
    all_chunks: list[Chunk] = []
    for repo_file in repo_files:
        all_chunks.extend(chunk_file(repo_file))
    return all_chunks

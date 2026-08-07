"""
Handles cloning a GitHub repository and walking its file tree to produce a
filtered list of (path, language, content) tuples ready for chunking.
"""
from __future__ import annotations

import shutil
from dataclasses import dataclass
from pathlib import Path

from git import Repo

from app.config import get_settings

settings = get_settings()

LANGUAGE_BY_EXTENSION = {
    ".py": "Python", ".js": "JavaScript", ".jsx": "JavaScript (JSX)",
    ".ts": "TypeScript", ".tsx": "TypeScript (TSX)", ".java": "Java",
    ".vue": "Vue", ".md": "Markdown", ".txt": "Text", ".rst": "reStructuredText",
    ".json": "JSON", ".yaml": "YAML", ".yml": "YAML", ".go": "Go", ".rb": "Ruby",
    ".c": "C", ".cpp": "C++", ".h": "C Header", ".hpp": "C++ Header", ".cs": "C#",
    ".php": "PHP", ".rs": "Rust", ".kt": "Kotlin", ".swift": "Swift", ".sql": "SQL",
    ".sh": "Shell",
}


@dataclass
class RepoFile:
    relative_path: str
    language: str
    content: str
    size_bytes: int


class RepoIngestionError(Exception):
    """Raised for any failure during clone or file-tree walking."""


def clone_repository(repo_url: str, repo_id: str, branch: str | None = None) -> Path:
    """Shallow-clones the given repo into storage/repos/<repo_id>. Returns the path."""
    dest = Path(settings.repo_clone_dir) / repo_id
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True, exist_ok=True)

    try:
        clone_kwargs = {"depth": 1}
        if branch:
            clone_kwargs["branch"] = branch
        Repo.clone_from(repo_url, dest, **clone_kwargs)
    except Exception as exc:  # GitCommandError and friends
        shutil.rmtree(dest, ignore_errors=True)
        raise RepoIngestionError(
            f"Could not clone '{repo_url}'. Check the URL is public and reachable. ({exc})"
        ) from exc

    total_size = sum(f.stat().st_size for f in dest.rglob("*") if f.is_file())
    if total_size > settings.max_repo_size_mb * 1024 * 1024:
        shutil.rmtree(dest, ignore_errors=True)
        raise RepoIngestionError(
            f"Repository exceeds the {settings.max_repo_size_mb}MB processing limit."
        )

    return dest


def walk_repository(repo_path: Path) -> list[RepoFile]:
    """Walks the cloned repo, skipping ignored directories and binary/unsupported files."""
    results: list[RepoFile] = []

    for path in repo_path.rglob("*"):
        if not path.is_file():
            continue
        if any(part in settings.ignored_dirs for part in path.parts):
            continue
        if path.suffix.lower() not in settings.allowed_extensions:
            continue

        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        if not content.strip():
            continue

        relative = str(path.relative_to(repo_path))
        language = LANGUAGE_BY_EXTENSION.get(path.suffix.lower(), "Other")
        results.append(
            RepoFile(
                relative_path=relative,
                language=language,
                content=content,
                size_bytes=path.stat().st_size,
            )
        )

    return results


def cleanup_repository(repo_path: Path) -> None:
    shutil.rmtree(repo_path, ignore_errors=True)

"""
Tracks metadata about each indexed repository (URL, stats, timestamps) so
/repo-stats and /search-history can look repos up by id without re-walking
the filesystem. Persisted to a small JSON file so it survives restarts.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from app.config import get_settings

settings = get_settings()
_REGISTRY_PATH = Path(settings.chroma_persist_dir).parent / "repo_registry.json"


@dataclass
class RepoMeta:
    repo_id: str
    repo_url: str
    total_files: int = 0
    total_chunks: int = 0
    languages: dict[str, int] = field(default_factory=dict)
    largest_files: list[dict] = field(default_factory=list)
    indexed_at: str | None = None


class RepoRegistry:
    def __init__(self) -> None:
        self._repos: dict[str, RepoMeta] = {}
        self._load()

    def _load(self) -> None:
        if _REGISTRY_PATH.exists():
            raw = json.loads(_REGISTRY_PATH.read_text())
            self._repos = {k: RepoMeta(**v) for k, v in raw.items()}

    def _save(self) -> None:
        _REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
        _REGISTRY_PATH.write_text(json.dumps({k: asdict(v) for k, v in self._repos.items()}, indent=2))

    def upsert(self, meta: RepoMeta) -> None:
        meta.indexed_at = datetime.now(timezone.utc).isoformat()
        self._repos[meta.repo_id] = meta
        self._save()

    def get(self, repo_id: str) -> RepoMeta | None:
        return self._repos.get(repo_id)

    def all(self) -> list[RepoMeta]:
        return list(self._repos.values())


_registry: RepoRegistry | None = None


def get_repo_registry() -> RepoRegistry:
    global _registry
    if _registry is None:
        _registry = RepoRegistry()
    return _registry

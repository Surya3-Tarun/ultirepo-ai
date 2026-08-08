"""
Central configuration for ULTIREPO AI backend.

All secrets and tunables are pulled from environment variables so nothing
sensitive is ever hardcoded. See .env.example for the full list of keys.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- LLM / embedding providers ---
    gemini_api_key: str = ""
    openai_api_key: str = ""
    llm_provider: str = "gemini"          # "gemini" | "openai" (interface allows swapping)
    gemini_model: str = "gemini-2.0-flash"
    embedding_provider: str = "local"      # "local" (sentence-transformers) | "gemini"
    local_embedding_model: str = "all-MiniLM-L6-v2"

    # --- RAG tuning ---
    chunk_size: int = 1200
    chunk_overlap: int = 200
    default_top_k: int = 6
    max_context_chars: int = 12000

    # --- Storage ---
    chroma_persist_dir: str = "storage/chroma"
    repo_clone_dir: str = "storage/repos"
    history_db_path: str = "storage/history.sqlite3"

    # --- Server ---
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    max_repo_size_mb: int = 500

    # --- File filtering ---
    ignored_dirs: set[str] = {
        ".git", "node_modules", "dist", "build", "__pycache__",
        ".venv", "venv", ".next", "target", "vendor", ".idea", ".vscode",
    }
    allowed_extensions: set[str] = {
        ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".vue", ".md", ".txt",
        ".rst", ".json", ".yaml", ".yml", ".go", ".rb", ".c", ".cpp", ".h",
        ".hpp", ".cs", ".php", ".rs", ".kt", ".swift", ".sql", ".sh",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()

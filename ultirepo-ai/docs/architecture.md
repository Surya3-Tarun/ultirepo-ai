# ULTIREPO AI — Architecture Notes

## RAG Pipeline

```
GitHub URL
    │
    ▼
[1] Clone (GitPython, shallow depth=1) ──► backend/storage/repos/<repo_id>/
    │
    ▼
[2] Walk file tree — skip .git/, node_modules/, build artifacts, binaries
    │  keep: .py .js .jsx .ts .tsx .java .vue .md .txt and other source/doc files
    ▼
[3] Chunk — LangChain RecursiveCharacterTextSplitter, language-aware where
    │  possible (Python/JS/TS/Java/Go/Ruby/Rust/PHP/Kotlin/C/C++/C#/Markdown),
    │  so functions/classes aren't split mid-body where avoidable
    ▼
[4] Embed — Sentence Transformers (local, free, default) or Gemini
    │  text-embedding-004 (set EMBEDDING_PROVIDER=gemini)
    ▼
[5] Index — ChromaDB, one persistent collection per repo_id (namespaced,
    │  so multiple repos never collide)
    ▼
Ready for queries
```

### Answering a question

```
User question
    │
    ▼
Embed query (same provider as indexing)
    │
    ▼
Similarity search in ChromaDB (top_k configurable, default 6)
    │
    ▼
Assemble retrieved chunks + rolling conversation memory into a system prompt
    │
    ▼
Stream from the LLM (Gemini by default; OpenAI swappable via LLM_PROVIDER)
    │
    ▼
Answer streamed token-by-token over SSE, plus a `sources` event
listing every chunk's file path, line range, and relevance score
```

### Provider abstraction

Both the embedding provider (`app/services/embeddings.py`) and the LLM
client (`app/services/llm_client.py`) are defined behind small abstract
interfaces (`EmbeddingProvider`, `LLMClient`). Swapping Gemini for OpenAI,
or local embeddings for Gemini's hosted embeddings, is a config change
(`.env`) — no call sites elsewhere in the codebase need to change.

### Progress reporting

Ingestion runs as a FastAPI `BackgroundTask`. Each stage transition is
pushed through `JobManager`, which fans out to:
- `GET /process-status/{repo_id}` — simple polling
- `WS /ws/process-status/{repo_id}` — live push updates, used by the
  Repository Processing page's pipeline visualization

## Knowledge Graph

The Knowledge Graph page renders a force-directed graph (D3.js) with
three tiers: the repository root, its detected languages, and the
largest files within each language — all derived directly from the
`/repo-stats` response, so the graph is genuinely data-driven rather
than a static illustration. Nodes are draggable; the simulation
continues to settle around user interaction.

## Why namespaced ChromaDB collections?

Each indexed repository gets its own collection (`repo_<repo_id>`)
rather than one shared collection with a metadata filter. This keeps
queries fast as the number of indexed repos grows, and makes deleting
or re-indexing a single repo a clean, isolated operation.

# ULTIREPO AI

### An Intelligent GitHub Repository Q&A System Powered by Retrieval-Augmented Generation

Built by **Surya** — RAG & Knowledge Bots category (GitHub Repository Q&A)

---

## Problem Statement

Understanding an unfamiliar codebase is slow: cloning it, grepping
around, reading half-relevant files, and piecing together how modules
connect. ULTIREPO AI removes that friction — point it at a public
GitHub repository and ask questions about it in plain language. Answers
are grounded in the actual retrieved code and documentation, with exact
file and line citations, not generic guesses from a general-purpose
chatbot.

## Features

- **Real RAG, not a facade** — clone → parse → chunk → embed → index →
  retrieve → generate, fully implemented end to end
- **Streaming, cited answers** — token-by-token responses with
  expandable source cards showing file path, line range, and relevance
- **Conversation memory** — follow-up questions retain context per session
- **Live processing visualization** — WebSocket-driven pipeline progress
- **Repository statistics & knowledge graph** — language breakdown,
  largest files, and a force-directed relationship graph
- **Search history** — every question is archived and re-runnable
- **Swappable providers** — Gemini (default) or OpenAI for generation;
  local Sentence Transformers (default, free) or Gemini for embeddings
- **Ben 10: Ultimate Alien-themed Omnitrix Operating System UI** — a
  standout, fully original interface: cinematic splash sequence, nine
  rotating alien-tech page transitions, an Omnitrix-dial motif reused as
  the primary CTA and "thinking" indicator, a Three.js particle/DNA-helix
  background, and a full sound-hook architecture (synthesized
  placeholder SFX out of the box, ready for licensed audio to be dropped
  in without touching component code)

## Screenshots

> _Add screenshots here after running the app locally:_
> `docs/screenshots/splash.png`, `docs/screenshots/chat.png`,
> `docs/screenshots/stats.png`, `docs/screenshots/graph.png`

## Technologies Used

| Layer | Stack |
|---|---|
| Backend | Python 3.12, FastAPI, LangChain, ChromaDB, Sentence Transformers, GitPython, Google Gemini API |
| Frontend | React (Vite), Tailwind CSS, Framer Motion, GSAP, Three.js, D3.js, Recharts |
| Storage | ChromaDB (vector index), SQLite (chat history), JSON (repo registry) |

See [`docs/architecture.md`](docs/architecture.md) for the full RAG
pipeline diagram and design notes.

## Installation

### Prerequisites
- Python 3.12+
- Node.js 20+
- Git
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier available)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and set GEMINI_API_KEY=your_key_here

uvicorn app.main:app --reload --port 8000
```

The API is now live at `http://localhost:8000` (interactive docs at
`http://localhost:8000/docs`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api/*` to the backend
automatically in dev (see `vite.config.js`).

### Running tests

```bash
cd backend
pytest
```

## Usage

1. On first load, watch (or skip) the boot sequence.
2. Go to **Repository Upload**, paste a public GitHub URL, and submit.
3. Watch the live pipeline on **Repository Processing**.
4. Once indexed, explore **Repository Statistics** and the **Knowledge
   Graph**, or jump straight into **Chat** to start asking questions.
5. Past questions are archived under **Search History** and can be
   re-run with one click.
6. Tune retrieval (`top_k`) and toggle sound/voice under **Settings**.

## Deployment

**Recommended: Render**, using the included `docker-compose.yml` as a
reference for the two services (or as two separate Render services):

1. **Backend** — new Render *Web Service*, root directory `backend/`,
   Render auto-detects the `Dockerfile`. Add environment variables from
   `.env.example` (at minimum `GEMINI_API_KEY`). Attach a persistent
   disk mounted at `/app/storage` so the vector index and history
   survive restarts.
2. **Frontend** — new Render *Static Site* (or Web Service using
   `frontend/Dockerfile`), root directory `frontend/`, build command
   `npm run build`, publish directory `dist`. Set `VITE_API_BASE_URL`
   to your deployed backend's URL.
3. Update the backend's `CORS_ORIGINS` setting to include your deployed
   frontend URL.

Local full-stack (no cloud): `docker compose up --build` from the repo
root.

**Deployment Link:** _add your live URL here once deployed_

## Project Structure

```
ultirepo-ai/
├── backend/
│   ├── app/
│   │   ├── routers/        # upload, status, stats, chat, history, health
│   │   ├── services/       # ingestion, chunking, embeddings, vectorstore,
│   │   │                   # llm_client, rag_pipeline, memory, history, registry
│   │   ├── models/         # Pydantic schemas
│   │   ├── config.py
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # AlienTransition, OmnitrixCore, ParticleField,
│   │   │                   # SplashScreen, PageAnnouncer, AppShell, ...
│   │   ├── pages/           # Home, Upload, Processing, Stats, KnowledgeGraph,
│   │   │                   # Chat, History, Settings, About
│   │   ├── lib/             # api.js, soundManager.js
│   │   └── store/           # RepoContext
│   ├── public/sounds/       # drop licensed SFX/VO here (see soundManager.js)
│   └── package.json
├── docs/
│   └── architecture.md
├── docker-compose.yml
└── README.md
```

## Credits

Built by **Surya**. Sound-trigger architecture ships with synthesized
placeholder SFX only — no third-party copyrighted audio (Ben 10 voice
clips, game SFX packs, etc.) is bundled. Drop your own licensed audio
into `frontend/public/sounds/` following the filenames in
`src/lib/soundManager.js` to upgrade the experience.

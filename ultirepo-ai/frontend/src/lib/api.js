/**
 * Thin fetch wrapper for the ULTIREPO AI backend. Vite proxies /api/* to
 * the FastAPI server in dev (see vite.config.js); set VITE_API_BASE_URL
 * for production builds pointing at a deployed backend.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return response.json();
}

export const api = {
  uploadRepo: (repoUrl, branch) =>
    request("/upload-repo", { method: "POST", body: JSON.stringify({ repo_url: repoUrl, branch }) }),

  processStatus: (repoId) => request(`/process-status/${repoId}`),

  repoStats: (repoId) => request(`/repo-stats/${repoId}`),

  listRepos: () => request("/repos"),

  searchHistory: (repoId) => request(`/search-history${repoId ? `?repo_id=${repoId}` : ""}`),

  health: () => request("/health"),

  processStatusSocket: (repoId) => {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const backendHost = import.meta.env.VITE_API_WS_HOST || `${window.location.hostname}:8000`;
    return new WebSocket(`${proto}://${backendHost}/ws/process-status/${repoId}`);
  },

  /**
   * Streams a chat answer via Server-Sent Events. Calls onToken for each
   * incremental piece of text, onSources once citations arrive, and
   * onDone when the stream completes.
   */
  async streamChat({ repoId, question, sessionId, topK, onToken, onSources, onSession, onError, onDone }) {
    const response = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_id: repoId, question, session_id: sessionId, top_k: topK }),
    });
    if (!response.ok || !response.body) {
      const body = await response.json().catch(() => ({}));
      onError?.(body.detail || "Chat request failed");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") {
          onDone?.();
          continue;
        }
        try {
          const event = JSON.parse(payload);
          if (event.type === "token") onToken?.(event.content);
          if (event.type === "sources") onSources?.(event.content);
          if (event.type === "session") onSession?.(event.content);
          if (event.type === "error") onError?.(event.content);
        } catch {
          // Ignore malformed SSE fragments
        }
      }
    }
  },
};

export default api;

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, AlertTriangle } from "lucide-react";
import PageHeading from "../components/PageHeading";
import OmnitrixCore from "../components/OmnitrixCore";
import { useRepo } from "../store/RepoContext";
import api from "../lib/api";
import SoundManager from "../lib/soundManager";

const STAGES = [
  { key: "cloning", label: "Cloning Repository" },
  { key: "parsing", label: "Parsing File Tree" },
  { key: "chunking", label: "Chunking Content" },
  { key: "embedding", label: "Generating Embeddings" },
  { key: "indexing", label: "Writing Knowledge Index" },
  { key: "ready", label: "Knowledge Core Online" },
];

export default function Processing() {
  const { activeRepo } = useRepo();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ stage: "queued", progress_percent: 0, detail: "Waiting for scan to begin..." });
  const socketRef = useRef(null);

  useEffect(() => {
    if (!activeRepo?.repoId) return undefined;

    let pollTimer;
    try {
      const socket = api.processStatusSocket(activeRepo.repoId);
      socketRef.current = socket;
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        setStatus(payload);
        if (payload.stage === "ready") SoundManager.playPortalOpen();
      };
      socket.onerror = () => {
        // Fall back to polling if the WebSocket can't connect.
        pollTimer = setInterval(async () => {
          try {
            const result = await api.processStatus(activeRepo.repoId);
            setStatus(result);
            if (result.stage === "ready" || result.stage === "error") clearInterval(pollTimer);
          } catch {
            clearInterval(pollTimer);
          }
        }, 1500);
      };
    } catch {
      // WebSocket unsupported - polling fallback only
    }

    return () => {
      socketRef.current?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [activeRepo?.repoId]);

  const currentIndex = STAGES.findIndex((s) => s.key === status.stage);

  if (!activeRepo?.repoId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <PageHeading eyebrow="REACTOR STATUS" title="No Active Scan" subtitle="Upload a repository first to begin indexing." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <PageHeading eyebrow="DNA SCAN IN PROGRESS" title="Repository Processing" subtitle={activeRepo.repoUrl} />

      <div className="flex justify-center mb-10">
        <OmnitrixCore size={140} spinning={status.stage !== "ready" && status.stage !== "error"} />
      </div>

      <div className="hologram-panel p-6">
        <div className="w-full h-2 rounded-full bg-space-gray overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-alien-emerald to-energy-cyan"
            animate={{ width: `${status.progress_percent}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="space-y-3">
          {STAGES.map((stage, i) => {
            const isDone = status.stage === "ready" || i < currentIndex || (status.stage === stage.key && stage.key === "ready");
            const isActive = stage.key === status.stage;
            return (
              <div key={stage.key} className="flex items-center gap-3 font-tech text-sm">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    isDone
                      ? "bg-alien-emerald/20 border-alien-emerald text-alien-emerald"
                      : isActive
                        ? "border-energy-cyan text-energy-cyan animate-pulse-glow"
                        : "border-core-white/15 text-core-white/30"
                  }`}
                >
                  {isDone ? <Check size={14} /> : i + 1}
                </div>
                <span className={isDone || isActive ? "text-core-white" : "text-core-white/30"}>{stage.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 font-body text-xs text-core-white/50">{status.detail}</div>

        {status.stage === "error" && (
          <div className="mt-4 flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{status.error}</span>
          </div>
        )}

        {status.stage === "ready" && (
          <button
            type="button"
            onClick={() => navigate("/stats")}
            className="mt-6 w-full font-display tracking-widest text-sm bg-alien-emerald/10 border border-alien-emerald text-alien-emerald rounded-lg py-3 hover:bg-alien-emerald/20 hover:shadow-glow transition-all"
          >
            VIEW REPOSITORY STATISTICS
          </button>
        )}
      </div>
    </div>
  );
}

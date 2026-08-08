import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Clock } from "lucide-react";
import PageHeading from "../components/PageHeading";
import { useRepo } from "../store/RepoContext";
import api from "../lib/api";

export default function History() {
  const { activeRepo } = useRepo();
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .searchHistory(activeRepo?.repoId)
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeRepo?.repoId]);

  const handleRerun = (question) => {
    sessionStorage.setItem("ultirepo:rerun-question", question);
    navigate("/chat");
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <PageHeading
        eyebrow="MEMORY ARCHIVE"
        title="Search History"
        subtitle={activeRepo ? `Past sessions for ${activeRepo.repoUrl}` : "Past sessions across all indexed repositories."}
      />

      {loading && <div className="font-tech text-sm text-alien-emerald animate-pulse-glow">LOADING ARCHIVE...</div>}
      {error && <div className="font-body text-sm text-red-400">{error}</div>}

      {!loading && entries.length === 0 && (
        <div className="hologram-panel p-8 text-center font-body text-core-white/40">
          No queries recorded yet. Ask something in Chat to begin building your archive.
        </div>
      )}

      <div className="space-y-3">
        {entries.map((entry, i) => (
          <motion.div
            key={`${entry.session_id}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.4) }}
            className="hologram-panel p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-body text-sm text-core-white">{entry.question}</div>
                <div className="font-body text-xs text-core-white/40 mt-1.5 line-clamp-2">{entry.answer}</div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-tech text-energy-cyan/50">
                  <Clock size={11} />
                  {new Date(entry.created_at).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRerun(entry.question)}
                className="shrink-0 text-core-white/40 hover:text-alien-emerald transition-colors"
                title="Re-run this question"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

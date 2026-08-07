import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Files, Layers, Cpu, Clock } from "lucide-react";
import PageHeading from "../components/PageHeading";
import { useRepo } from "../store/RepoContext";
import api from "../lib/api";

const BAR_COLORS = ["#0fff9a", "#25f4ee", "#a4ff2e", "#0fff9a", "#25f4ee", "#a4ff2e"];

function StatCard({ icon: Icon, label, value, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="hologram-panel p-5 flex items-center gap-4"
    >
      <div className="w-11 h-11 rounded-lg bg-alien-emerald/10 border border-alien-emerald/30 flex items-center justify-center text-alien-emerald shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <div className="font-display text-xl text-core-white">{value}</div>
        <div className="font-tech text-xs tracking-widest text-core-white/40">{label}</div>
      </div>
    </motion.div>
  );
}

export default function Stats() {
  const { activeRepo } = useRepo();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeRepo?.repoId) return;
    api
      .repoStats(activeRepo.repoId)
      .then(setStats)
      .catch((err) => setError(err.message));
  }, [activeRepo?.repoId]);

  if (!activeRepo?.repoId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24">
        <PageHeading eyebrow="DATA CORE" title="No Repository Indexed" subtitle="Upload and index a repository to view its statistics." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24">
        <PageHeading eyebrow="DATA CORE" title="Statistics Unavailable" subtitle={error} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24">
        <PageHeading eyebrow="DATA CORE" title="Loading Statistics..." />
      </div>
    );
  }

  const languageData = Object.entries(stats.languages).map(([language, count]) => ({ language, count }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <PageHeading eyebrow="DATA CORE ANALYSIS" title="Repository Statistics" subtitle={stats.repo_url} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Files} label="FILES INDEXED" value={stats.total_files} delay={0} />
        <StatCard icon={Layers} label="TOTAL CHUNKS" value={stats.total_chunks} delay={0.05} />
        <StatCard icon={Cpu} label="EMBEDDINGS" value={stats.total_embeddings} delay={0.1} />
        <StatCard
          icon={Clock}
          label="INDEXED"
          value={stats.indexed_at ? new Date(stats.indexed_at).toLocaleDateString() : "—"}
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="hologram-panel p-5">
          <div className="font-display text-sm text-alien-emerald mb-4 tracking-wide">LANGUAGES DETECTED</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={languageData}>
              <XAxis dataKey="language" stroke="#eafff5" opacity={0.4} fontSize={11} />
              <YAxis stroke="#eafff5" opacity={0.4} fontSize={11} />
              <Tooltip contentStyle={{ background: "#0a0f0c", border: "1px solid rgba(15,255,154,0.3)" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {languageData.map((entry, i) => (
                  <Cell key={entry.language} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="hologram-panel p-5">
          <div className="font-display text-sm text-alien-emerald mb-4 tracking-wide">LARGEST FILES</div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {stats.largest_files.map((file) => (
              <div key={file.path} className="flex items-center justify-between font-tech text-xs bg-space-black/50 rounded px-3 py-2">
                <span className="truncate text-core-white/70">{file.path}</span>
                <span className="text-alien-emerald shrink-0 ml-2">{(file.size_bytes / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

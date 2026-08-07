import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageHeading from "../components/PageHeading";
import { useRepo } from "../store/RepoContext";
import SoundManager from "../lib/soundManager";
import api from "../lib/api";

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-alien-emerald/10 last:border-b-0">
      <div>
        <div className="font-tech text-sm text-core-white">{label}</div>
        {description && <div className="font-body text-xs text-core-white/40 mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${checked ? "bg-alien-emerald/40" : "bg-space-gray"}`}
      >
        <motion.div
          animate={{ x: checked ? 24 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-1 w-4 h-4 rounded-full ${checked ? "bg-alien-emerald shadow-glow" : "bg-core-white/40"}`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { soundEnabled, setSoundEnabled, voiceEnabled, setVoiceEnabled, topK, setTopK } = useRepo();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    SoundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <PageHeading eyebrow="SYSTEM CONFIGURATION" title="Settings" subtitle="Tune retrieval behavior and interface sound." />

      <div className="hologram-panel p-6 mb-6">
        <div className="font-tech text-xs tracking-widest text-energy-cyan/80 mb-3">ACTIVE PROVIDERS</div>
        {health ? (
          <div className="grid grid-cols-2 gap-4 font-body text-sm">
            <div>
              <div className="text-core-white/40 text-xs">LLM Provider</div>
              <div className="text-alien-emerald capitalize">{health.llm_provider}</div>
            </div>
            <div>
              <div className="text-core-white/40 text-xs">Embedding Provider</div>
              <div className="text-alien-emerald capitalize">{health.embedding_provider}</div>
            </div>
          </div>
        ) : (
          <div className="font-body text-xs text-core-white/40">
            Backend unreachable — start the FastAPI server to see live provider status.
          </div>
        )}
        <div className="font-body text-xs text-core-white/30 mt-3">
          Change providers via LLM_PROVIDER / EMBEDDING_PROVIDER in backend/.env, then restart the server.
        </div>
      </div>

      <div className="hologram-panel p-6 mb-6">
        <div className="font-tech text-xs tracking-widest text-energy-cyan/80 mb-3">RETRIEVAL</div>
        <label className="block">
          <div className="flex justify-between font-body text-sm mb-2">
            <span>Top-K Retrieved Chunks</span>
            <span className="text-alien-emerald">{topK}</span>
          </div>
          <input
            type="range"
            min={2}
            max={15}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="w-full accent-alien-emerald"
          />
        </label>
      </div>

      <div className="hologram-panel p-6">
        <div className="font-tech text-xs tracking-widest text-energy-cyan/80 mb-2">INTERFACE</div>
        <ToggleRow
          label="Sound Effects"
          description="Omnitrix charge, scan, and portal sounds"
          checked={soundEnabled}
          onChange={setSoundEnabled}
        />
        <ToggleRow
          label="Voice Announcer"
          description="Spoken page announcements and answer read-aloud"
          checked={voiceEnabled}
          onChange={setVoiceEnabled}
        />
      </div>
    </div>
  );
}

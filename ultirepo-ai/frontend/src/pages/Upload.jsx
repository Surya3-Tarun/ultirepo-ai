import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GitBranch, Zap } from "lucide-react";
import PageHeading from "../components/PageHeading";
import { useRepo } from "../store/RepoContext";
import api from "../lib/api";
import SoundManager from "../lib/soundManager";

export default function Upload() {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { setActiveRepo } = useRepo();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!repoUrl.trim()) {
      setError("Enter a GitHub repository URL to begin the scan.");
      return;
    }

    setSubmitting(true);
    SoundManager.playEnergyCharge();
    try {
      const result = await api.uploadRepo(repoUrl.trim(), branch.trim() || undefined);
      setActiveRepo({ repoId: result.repo_id, repoUrl: repoUrl.trim() });
      navigate("/processing");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <PageHeading
        eyebrow="ENERGY INTAKE"
        title="Repository Upload"
        subtitle="Point ULTIREPO AI at any public GitHub repository. It will clone, parse, chunk, embed, and index it into an alien knowledge core."
      />

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="hologram-panel p-6 space-y-5"
      >
        <label className="block">
          <span className="font-tech text-xs tracking-widest text-energy-cyan/80">GITHUB REPOSITORY URL</span>
          <div className="mt-2 flex items-center gap-2 bg-space-black/60 border border-alien-emerald/25 rounded-lg px-3 py-2.5 focus-within:border-alien-emerald focus-within:shadow-glow transition-all">
            <Zap size={16} className="text-alien-emerald" />
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full bg-transparent outline-none font-body text-sm placeholder:text-core-white/30"
            />
          </div>
        </label>

        <label className="block">
          <span className="font-tech text-xs tracking-widest text-energy-cyan/80">BRANCH (OPTIONAL)</span>
          <div className="mt-2 flex items-center gap-2 bg-space-black/60 border border-alien-emerald/25 rounded-lg px-3 py-2.5 focus-within:border-alien-emerald focus-within:shadow-glow transition-all">
            <GitBranch size={16} className="text-alien-emerald" />
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full bg-transparent outline-none font-body text-sm placeholder:text-core-white/30"
            />
          </div>
        </label>

        {error && (
          <div className="text-sm font-body text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full font-display tracking-widest text-sm bg-alien-emerald/10 border border-alien-emerald text-alien-emerald rounded-lg py-3 hover:bg-alien-emerald/20 hover:shadow-glow transition-all disabled:opacity-40"
        >
          {submitting ? "INITIATING SCAN..." : "BEGIN SCAN"}
        </button>
      </motion.form>
    </div>
  );
}

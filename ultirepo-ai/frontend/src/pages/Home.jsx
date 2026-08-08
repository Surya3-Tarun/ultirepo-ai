import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import OmnitrixCore from "../components/OmnitrixCore";
import { useRepo } from "../store/RepoContext";
import SoundManager from "../lib/soundManager";

export default function Home() {
  const navigate = useNavigate();
  const { activeRepo } = useRepo();

  const handleActivate = () => {
    SoundManager.playAlienActivate();
    navigate(activeRepo ? "/chat" : "/upload");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-3 font-tech text-xs tracking-[0.4em] text-energy-cyan/80"
      >
        OMNITRIX OPERATING SYSTEM — KNOWLEDGE CORE
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-display text-4xl md:text-6xl font-black text-gradient tracking-wide mb-4"
      >
        ULTIREPO AI
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="font-body text-core-white/60 max-w-xl mb-14"
      >
        An intelligent GitHub repository Q&amp;A system powered by Retrieval-Augmented Generation.
        Feed it any repository. Ask it anything. Get answers grounded in the actual code.
      </motion.p>

      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <OmnitrixCore
          size={180}
          onClick={handleActivate}
          label={activeRepo ? "RESUME QUERY MODE" : "BEGIN SCAN"}
          subLabel={activeRepo ? activeRepo.repoUrl : "Tap to index a repository"}
        />
      </motion.div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl">
        {[
          { title: "Repository Scan", desc: "Clones and walks your codebase, filtering noise automatically." },
          { title: "Semantic Retrieval", desc: "Embeds every chunk and retrieves the most relevant context per question." },
          { title: "Grounded Answers", desc: "Every response cites the exact files and lines it drew from." },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
            className="hologram-panel p-5 text-left"
          >
            <div className="font-display text-sm text-alien-emerald mb-2 tracking-wide">{item.title}</div>
            <div className="font-body text-sm text-core-white/50">{item.desc}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

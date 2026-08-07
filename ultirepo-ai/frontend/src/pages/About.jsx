import { motion } from "framer-motion";
import PageHeading from "../components/PageHeading";

const STACK = {
  Backend: ["Python 3.12", "FastAPI", "LangChain", "ChromaDB", "Sentence Transformers", "Google Gemini API", "GitPython"],
  Frontend: ["React + Vite", "Tailwind CSS", "Framer Motion", "GSAP", "Three.js", "D3.js", "Recharts"],
};

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <PageHeading eyebrow="ORIGIN FILE" title="About ULTIREPO AI" subtitle="An Intelligent GitHub Repository Q&A System Powered by Retrieval-Augmented Generation" />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hologram-panel p-6 mb-6">
        <p className="font-body text-sm text-core-white/70 leading-relaxed">
          ULTIREPO AI answers natural-language questions about any GitHub repository using genuine
          retrieval-augmented generation — not a generic chatbot wrapper. Every answer is grounded in
          actual retrieved code and documentation chunks, cited by file and line.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {Object.entries(STACK).map(([category, items]) => (
          <div key={category} className="hologram-panel p-6">
            <div className="font-tech text-xs tracking-widest text-energy-cyan/80 mb-3">{category.toUpperCase()}</div>
            <ul className="space-y-1.5 font-body text-sm text-core-white/70">
              {items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-alien-emerald" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="hologram-panel p-6 text-center">
        <div className="font-tech text-xs tracking-widest text-energy-cyan/60 mb-1">BUILT BY</div>
        <div className="font-display text-xl text-gradient">Surya</div>
        <div className="font-body text-xs text-core-white/40 mt-2">
          RAG &amp; Knowledge Bots — GitHub Repository Q&amp;A category
        </div>
      </div>
    </div>
  );
}

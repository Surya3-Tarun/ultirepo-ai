import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SoundManager from "../lib/soundManager";

const ANNOUNCEMENTS = {
  "/": "ULTIREPO... ACTIVATED",
  "/upload": "REPOSITORY INTAKE READY",
  "/processing": "REPOSITORY SCAN INITIATED",
  "/stats": "DATA CORE ANALYSIS",
  "/graph": "KNOWLEDGE GRAPH ONLINE",
  "/chat": "QUERY MODE ENGAGED",
  "/history": "MEMORY ARCHIVE OPEN",
  "/settings": "SYSTEM CONFIGURATION",
  "/about": "ORIGIN FILE ACCESSED",
};

export default function PageAnnouncer() {
  const location = useLocation();
  const [caption, setCaption] = useState(null);

  useEffect(() => {
    const text = ANNOUNCEMENTS[location.pathname] || "KNOWLEDGE CORE ONLINE";
    setCaption(text);
    SoundManager.announcePage(text);
    SoundManager.playScan();

    const timeout = setTimeout(() => setCaption(null), 2200);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <div className="pointer-events-none fixed top-6 left-1/2 -translate-x-1/2 z-[70]">
      <AnimatePresence>
        {caption && (
          <motion.div
            initial={{ opacity: 0, y: -10, letterSpacing: "0.1em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.35em" }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="hologram-panel px-6 py-2 font-display text-xs md:text-sm text-alien-emerald shadow-glow"
          >
            {caption}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

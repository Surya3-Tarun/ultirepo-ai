import { createContext, useContext, useEffect, useState } from "react";

const RepoContext = createContext(null);
const STORAGE_KEY = "ultirepo:active-repo";

export function RepoProvider({ children }) {
  const [activeRepo, setActiveRepo] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [topK, setTopK] = useState(6);

  useEffect(() => {
    try {
      if (activeRepo) localStorage.setItem(STORAGE_KEY, JSON.stringify(activeRepo));
    } catch {
      // localStorage unavailable - active repo just won't persist across reloads
    }
  }, [activeRepo]);

  return (
    <RepoContext.Provider
      value={{
        activeRepo,
        setActiveRepo,
        soundEnabled,
        setSoundEnabled,
        voiceEnabled,
        setVoiceEnabled,
        topK,
        setTopK,
      }}
    >
      {children}
    </RepoContext.Provider>
  );
}

export function useRepo() {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error("useRepo must be used inside RepoProvider");
  return ctx;
}

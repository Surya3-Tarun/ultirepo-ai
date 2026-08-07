import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RepoProvider } from "./store/RepoContext";
import SplashScreen from "./components/SplashScreen";
import AppShell from "./components/AppShell";
import AlienTransition from "./components/AlienTransition";
import PageAnnouncer from "./components/PageAnnouncer";
import CustomCursor from "./components/CustomCursor";

import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Processing from "./pages/Processing";
import Stats from "./pages/Stats";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import Chat from "./pages/Chat";
import History from "./pages/History";
import Settings from "./pages/Settings";
import About from "./pages/About";

function AppRoutes() {
  return (
    <AlienTransition>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/processing" element={<Processing />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/graph" element={<KnowledgeGraph />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </AlienTransition>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <RepoProvider>
      <BrowserRouter>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        {!showSplash && (
          <>
            <CustomCursor />
            <PageAnnouncer />
            <AppShell>
              <AppRoutes />
            </AppShell>
          </>
        )}
      </BrowserRouter>
    </RepoProvider>
  );
}

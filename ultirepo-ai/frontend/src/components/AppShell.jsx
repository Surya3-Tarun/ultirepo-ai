import { NavLink } from "react-router-dom";
import {
  Home,
  UploadCloud,
  Activity,
  BarChart3,
  Share2,
  MessageSquare,
  History,
  Settings,
  Info,
} from "lucide-react";
import SoundManager from "../lib/soundManager";
import ParticleField from "./ParticleField";

const NAV_ITEMS = [
  { to: "/", label: "Command Center", icon: Home },
  { to: "/upload", label: "Repository Upload", icon: UploadCloud },
  { to: "/processing", label: "Processing", icon: Activity },
  { to: "/stats", label: "Statistics", icon: BarChart3 },
  { to: "/graph", label: "Knowledge Graph", icon: Share2 },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/history", label: "Search History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/about", label: "About", icon: Info },
];

export default function AppShell({ children }) {
  return (
    <div className="relative min-h-screen flex hex-bg">
      <ParticleField density="low" />

      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-alien-emerald/15 bg-space-black/60 backdrop-blur-md p-5 gap-1">
        <div className="mb-8 px-2">
          <div className="font-display text-lg tracking-widest text-gradient">ULTIREPO</div>
          <div className="font-tech text-[10px] tracking-[0.3em] text-core-white/40">ALIEN INTELLIGENCE OS</div>
        </div>

        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => SoundManager.playUIClick()}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-tech text-sm tracking-wide transition-all ${
                isActive
                  ? "bg-alien-emerald/10 text-alien-emerald shadow-glow border border-alien-emerald/30"
                  : "text-core-white/60 hover:text-alien-emerald hover:bg-alien-emerald/5 border border-transparent"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </aside>

      <main className="flex-1 relative min-h-screen">{children}</main>
    </div>
  );
}

import { motion } from "framer-motion";

/**
 * The recurring Ultimatrix-dial motif. Used as the primary "activate"
 * button on Home, and as the "thinking / retrieving" indicator in Chat.
 */
export default function OmnitrixCore({ size = 160, spinning = false, onClick, label, subLabel }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: onClick ? 1.05 : 1 }}
      whileTap={{ scale: onClick ? 0.96 : 1 }}
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size, cursor: onClick ? "pointer" : "default" }}
    >
      <div
        className={`absolute inset-0 rounded-full border-2 border-alien-emerald/40 ${spinning ? "animate-spin-slow" : ""}`}
      />
      <div
        className={`absolute inset-3 rounded-full border border-energy-cyan/40 ${spinning ? "animate-spin-reverse" : ""}`}
      />
      <div className="absolute inset-6 rounded-full bg-gradient-to-br from-alien-emerald/20 to-energy-cyan/10 shadow-glow animate-pulse-glow" />

      <svg viewBox="0 0 100 100" className="relative w-2/3 h-2/3">
        <polygon
          points="50,5 90,27 90,73 50,95 10,73 10,27"
          fill="rgba(15,255,154,0.08)"
          stroke="#0fff9a"
          strokeWidth="2"
        />
        <circle cx="50" cy="50" r="18" fill="#04080a" stroke="#25f4ee" strokeWidth="2" />
        <circle cx="50" cy="50" r="7" fill="#0fff9a" className="animate-pulse-glow" />
      </svg>

      {(label || subLabel) && (
        <div className="absolute -bottom-10 text-center w-max left-1/2 -translate-x-1/2">
          {label && <div className="font-display text-xs md:text-sm tracking-[0.3em] text-alien-emerald">{label}</div>}
          {subLabel && <div className="font-tech text-[10px] text-core-white/50 mt-1">{subLabel}</div>}
        </div>
      )}
    </motion.button>
  );
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#04080a",
        "space-black": "#0a0f0c",
        "space-gray": "#151b19",
        "alien-emerald": "#0fff9a",
        "neon-lime": "#a4ff2e",
        "energy-cyan": "#25f4ee",
        "core-white": "#eafff5",
        "panel-glass": "rgba(15, 255, 154, 0.05)",
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        alien: ["Audiowide", "sans-serif"],
        tech: ["Rajdhani", "sans-serif"],
        body: ["Exo 2", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(15, 255, 154, 0.35), 0 0 60px rgba(15, 255, 154, 0.12)",
        "glow-cyan": "0 0 20px rgba(37, 244, 238, 0.35)",
      },
      backgroundImage: {
        "hex-grid": "linear-gradient(rgba(15,255,154,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(15,255,154,0.06) 1px, transparent 1px)",
      },
      animation: {
        "spin-slow": "spin 12s linear infinite",
        "spin-reverse": "spin-reverse 18s linear infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        scanline: "scanline 3s linear infinite",
      },
      keyframes: {
        "spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 0.6, filter: "drop-shadow(0 0 6px rgba(15,255,154,0.5))" },
          "50%": { opacity: 1, filter: "drop-shadow(0 0 22px rgba(15,255,154,0.9))" },
        },
        scanline: {
          "0%": { backgroundPosition: "0 -100%" },
          "100%": { backgroundPosition: "0 200%" },
        },
      },
    },
  },
  plugins: [],
};

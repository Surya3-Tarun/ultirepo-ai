import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useMemo, useRef } from "react";

/**
 * Every route change passes through one of nine transformation styles,
 * rotating deterministically by path so the same navigation always feels
 * consistent, while different destinations feel distinct.
 */
const TRANSITIONS = [
  {
    name: "energy-burst",
    initial: { opacity: 0, scale: 0.92, filter: "brightness(2.5)" },
    animate: { opacity: 1, scale: 1, filter: "brightness(1)" },
    exit: { opacity: 0, scale: 1.08, filter: "brightness(2.5)" },
    transition: { duration: 0.5, ease: "easeOut" },
  },
  {
    name: "ring-wipe",
    initial: { opacity: 0, clipPath: "circle(0% at 50% 50%)" },
    animate: { opacity: 1, clipPath: "circle(150% at 50% 50%)" },
    exit: { opacity: 0, clipPath: "circle(0% at 50% 50%)" },
    transition: { duration: 0.6, ease: [0.65, 0, 0.35, 1] },
  },
  {
    name: "scanline-sweep",
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -24 },
    transition: { duration: 0.45, ease: "easeInOut" },
  },
  {
    name: "plasma-morph",
    initial: { opacity: 0, scale: 1.15, borderRadius: "40%" },
    animate: { opacity: 1, scale: 1, borderRadius: "0%" },
    exit: { opacity: 0, scale: 0.9, borderRadius: "40%" },
    transition: { duration: 0.55, ease: "easeInOut" },
  },
  {
    name: "hex-dissolve",
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.03 },
    transition: { duration: 0.4, ease: "easeOut" },
  },
  {
    name: "hologram-flicker",
    initial: { opacity: 0, filter: "blur(6px) brightness(1.8)" },
    animate: { opacity: 1, filter: "blur(0px) brightness(1)" },
    exit: { opacity: 0, filter: "blur(6px) brightness(1.8)" },
    transition: { duration: 0.4 },
  },
  {
    name: "dial-snap",
    initial: { opacity: 0, rotate: -8, scale: 0.94 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 8, scale: 0.94 },
    transition: { duration: 0.4, ease: "backOut" },
  },
  {
    name: "portal-iris",
    initial: { opacity: 0, clipPath: "inset(45% 45% 45% 45% round 999px)" },
    animate: { opacity: 1, clipPath: "inset(0% 0% 0% 0% round 0px)" },
    exit: { opacity: 0, clipPath: "inset(45% 45% 45% 45% round 999px)" },
    transition: { duration: 0.55, ease: [0.76, 0, 0.24, 1] },
  },
  {
    name: "dna-dissolve",
    initial: { opacity: 0, x: -16, skewX: 4 },
    animate: { opacity: 1, x: 0, skewX: 0 },
    exit: { opacity: 0, x: 16, skewX: -4 },
    transition: { duration: 0.45 },
  },
];

function pickTransitionIndex(pathname) {
  let hash = 0;
  for (let i = 0; i < pathname.length; i += 1) hash = (hash * 31 + pathname.charCodeAt(i)) >>> 0;
  return hash % TRANSITIONS.length;
}

export default function AlienTransition({ children }) {
  const location = useLocation();
  const style = useMemo(() => TRANSITIONS[pickTransitionIndex(location.pathname)], [location.pathname]);
  const nodeRef = useRef(null);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        ref={nodeRef}
        initial={style.initial}
        animate={style.animate}
        exit={style.exit}
        transition={style.transition}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

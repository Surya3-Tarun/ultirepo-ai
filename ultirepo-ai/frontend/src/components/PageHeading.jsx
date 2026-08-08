import { motion } from "framer-motion";

export default function PageHeading({ eyebrow, title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      {eyebrow && (
        <div className="font-tech text-xs tracking-[0.35em] text-energy-cyan/80 mb-2">{eyebrow}</div>
      )}
      <h1 className="font-display text-2xl md:text-4xl text-gradient tracking-wide">{title}</h1>
      {subtitle && <p className="font-body text-core-white/50 mt-2 max-w-2xl">{subtitle}</p>}
    </motion.div>
  );
}

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ParticleField from "./ParticleField";
import SoundManager from "../lib/soundManager";

const LOGO_LETTERS = "ULTIREPO AI".split("");

/**
 * Full-screen boot sequence played once on load, before the dashboard
 * appears. Every beat is a named GSAP timeline label so sound cues
 * (energy-charge.mp3, transformation.mp3, portal-open.mp3) can be
 * dropped onto onComplete callbacks later without touching this file.
 */
export default function SplashScreen({ onComplete }) {
  const containerRef = useRef(null);
  const ringsRef = useRef(null);
  const logoRef = useRef(null);
  const hexRef = useRef(null);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => onComplete?.(),
    });

    tl.addLabel("boot")
      .set(containerRef.current, { autoAlpha: 1 })
      .call(() => SoundManager.playEnergyCharge())
      .from(".splash-particle-veil", { autoAlpha: 0, duration: 0.6 })

      .addLabel("rings")
      .fromTo(
        ringsRef.current.children,
        { scale: 0, opacity: 0, rotate: -90 },
        { scale: 1, opacity: 1, rotate: 0, duration: 0.9, stagger: 0.15, ease: "back.out(1.7)" }
      )

      .addLabel("hexagons")
      .call(() => SoundManager.playScan())
      .fromTo(
        hexRef.current.children,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.04, ease: "power2.out" },
        "-=0.3"
      )

      .addLabel("logo-assemble")
      .call(() => SoundManager.playAlienActivate())
      .fromTo(
        logoRef.current.children,
        { y: 40, opacity: 0, filter: "blur(8px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, stagger: 0.04, ease: "power3.out" },
        "-=0.2"
      )

      .addLabel("plasma-expand")
      .to(ringsRef.current, { scale: 2.4, opacity: 0, duration: 0.9, ease: "power2.in" })

      .addLabel("portal-open")
      .call(() => SoundManager.playPortalOpen())
      .to(containerRef.current, { autoAlpha: 0, duration: 0.6 }, "+=0.3");

    return () => tl.kill();
  }, [onComplete]);

  useEffect(() => {
    if (skip) onComplete?.();
  }, [skip, onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-void flex items-center justify-center overflow-hidden"
      style={{ opacity: 0 }}
    >
      <div className="splash-particle-veil absolute inset-0">
        <ParticleField density="high" />
      </div>

      {/* Hex grid materializing */}
      <div ref={hexRef} className="absolute inset-0 grid grid-cols-12 grid-rows-8 opacity-30">
        {Array.from({ length: 96 }).map((_, i) => (
          <div key={i} className="border border-alien-emerald/10" />
        ))}
      </div>

      {/* Concentric Omnitrix rings */}
      <div ref={ringsRef} className="absolute flex items-center justify-center">
        <div className="absolute w-72 h-72 rounded-full border-2 border-alien-emerald/50" />
        <div className="absolute w-56 h-56 rounded-full border border-energy-cyan/50" />
        <div className="absolute w-40 h-40 rounded-full border-2 border-alien-emerald/70 shadow-glow" />
        <div className="absolute w-24 h-24 rounded-full bg-alien-emerald/20 blur-xl" />
      </div>

      {/* Logo assembling from particles */}
      <div ref={logoRef} className="relative z-10 flex gap-1 md:gap-2">
        {LOGO_LETTERS.map((letter, i) => (
          <span
            key={`${letter}-${i}`}
            className="font-display text-3xl md:text-6xl font-900 text-gradient tracking-wider"
          >
            {letter === " " ? "\u00A0\u00A0" : letter}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setSkip(true)}
        className="absolute bottom-8 right-8 text-xs font-tech tracking-widest text-core-white/40 hover:text-alien-emerald transition-colors"
      >
        SKIP INTRO →
      </button>
    </div>
  );
}

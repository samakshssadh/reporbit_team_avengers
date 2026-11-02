import React, { useEffect } from "react";
import { motion } from "framer-motion";

const EASE = [0.76, 0, 0.24, 1] as [number, number, number, number];
const SOFT = [0.22, 1, 0.36, 1] as [number, number, number, number];

// Boot-up intro (minimal, cinematic):
// 1. a spark ignites  2. an orbit is drawn around it and a planet starts circling
// 3. "Reporbit" rises letter by letter out of a blur  4. a tangerine curtain wipes up to reveal the page.
// Plays once per browser session; click anywhere to skip.
export const Splash: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  useEffect(() => { const t = window.setTimeout(onDone, 2900); return () => window.clearTimeout(t); }, [onDone]);
  const letters = "Reporbit".split("");
  return (
    <motion.div className="splash fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer overflow-hidden" onClick={onDone}
      exit={{ clipPath: "inset(0 0 100% 0)" }} initial={{ clipPath: "inset(0 0 0% 0)" }} transition={{ duration: 0.8, ease: EASE }}>
      {/* curtain that chases the exit */}
      <motion.div className="absolute inset-0 z-10 bg-gradient-to-t from-tangerine-500 to-rose-500 origin-bottom" initial={{ scaleY: 0 }}
        animate={{ scaleY: [0, 0, 1] }} transition={{ duration: 2.9, times: [0, 0.82, 1], ease: EASE }} />

      <div className="relative w-40 h-40">
        {/* spark */}
        <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-tangerine-300 to-rose-500"
          initial={{ width: 0, height: 0 }} animate={{ width: 28, height: 28 }} transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 12 }}
          style={{ boxShadow: "0 0 50px 12px rgba(254,133,0,.55)" }} />
        <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-tangerine-400"
          initial={{ width: 10, height: 10, opacity: 1 }} animate={{ width: 220, height: 220, opacity: 0 }} transition={{ delay: 0.2, duration: 1.1, ease: SOFT }} />
        {/* orbit + planet */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 160" fill="none" aria-hidden="true">
          <motion.ellipse cx="80" cy="80" rx="70" ry="28" transform="rotate(-22 80 80)" stroke="url(#sg)" strokeWidth="1.5" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.45, duration: 0.9, ease: EASE }} />
          <defs><linearGradient id="sg" x1="0" x2="1"><stop offset="0" stopColor="#ffb15c" /><stop offset="1" stopColor="#ff3b66" /></linearGradient></defs>
        </svg>
        <motion.div className="absolute inset-0" style={{ rotate: -22 }}>
          <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
            <motion.span className="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full bg-white splash-planet"
              style={{ left: "50%", top: "50%", boxShadow: "0 0 14px 4px rgba(255,177,92,.9)" }}
              animate={{ x: [70, 0, -70, 0, 70], y: [0, 28, 0, -28, 0] }} transition={{ delay: 1.1, duration: 1.6, ease: "linear", repeat: Infinity }} />
          </motion.div>
        </motion.div>
      </div>

      <h1 className="relative mt-6 flex text-5xl sm:text-7xl font-semibold tracking-[-0.04em]" aria-label="Reporbit">
        {letters.map((ch, i) => (
          <span key={i} className="inline-block overflow-hidden pb-2">
            <motion.span className={`inline-block ${i >= 3 ? "text-gradient" : "splash-ink"}`}
              initial={{ y: "105%", filter: "blur(10px)" }} animate={{ y: "0%", filter: "blur(0px)" }}
              transition={{ delay: 0.75 + i * 0.05, duration: 0.8, ease: SOFT }}>{ch}</motion.span>
          </span>
        ))}
      </h1>
      <div className="relative overflow-hidden mt-2">
        <motion.p className="text-xs sm:text-sm uppercase tracking-[0.35em] splash-muted"
          initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ delay: 1.35, duration: 0.7, ease: SOFT }}>
          open source · in orbit
        </motion.p>
      </div>
    </motion.div>
  );
};

import React, { useEffect } from "react";
import { motion } from "framer-motion";

// Boot-up intro: the logo ignites, "Reporbit" slides up letter by letter, the tagline fades in,
// then everything lifts away to reveal the page. Plays once per browser session.
export const Splash: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  useEffect(() => { const t = window.setTimeout(onDone, 2300); return () => window.clearTimeout(t); }, [onDone]);
  const letters = "Reporbit".split("");
  return (
    <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer" onClick={onDone}
      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
      <motion.div className="relative" initial={{ scale: 0.2, opacity: 0, rotate: -90 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 180, damping: 14 }}>
        <motion.div className="absolute inset-0 rounded-full bg-tangerine-500/50 blur-2xl" animate={{ scale: [1, 1.5, 1.15], opacity: [0.6, 0.9, 0.5] }} transition={{ duration: 1.6, ease: "easeInOut" }} />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-tangerine-300 via-tangerine-500 to-rose-500 shadow-[0_0_60px_-6px_rgba(254,133,0,0.9)] flex items-center justify-center">
          <svg className="w-11 h-11 text-[#1b1d27]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <motion.ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-25 12 12)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 0.9, ease: "easeInOut" }} />
          </svg>
        </div>
      </motion.div>
      <h1 className="mt-7 flex text-5xl sm:text-6xl font-semibold tracking-tight" aria-label="Reporbit">
        {letters.map((ch, i) => (
          <span key={i} className="inline-block overflow-hidden pb-1">
            <motion.span className={`inline-block ${i >= 3 ? "text-tangerine-400" : "text-white"}`} initial={{ y: "120%", opacity: 0 }} animate={{ y: "0%", opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>{ch}</motion.span>
          </span>
        ))}
      </h1>
      <motion.p className="mt-3 text-sm sm:text-base text-white/60" initial={{ opacity: 0, y: 10, letterSpacing: "0.3em" }} animate={{ opacity: 1, y: 0, letterSpacing: "0.02em" }} transition={{ delay: 1.1, duration: 0.7 }}>
        Your first open-source contribution, in orbit.
      </motion.p>
      <motion.div className="mt-8 h-0.5 w-48 rounded-full bg-white/10 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
        <motion.div className="h-full bg-gradient-to-r from-tangerine-400 to-rose-500" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ delay: 0.9, duration: 1.3, ease: "easeInOut" }} />
      </motion.div>
    </motion.div>
  );
};

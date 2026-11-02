import React, { useRef, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform, MotionValue } from "framer-motion";
import { ArrowRight, ArrowUpRight, Github, Sun, Moon } from "lucide-react";
import { AuthModal, AuthMode } from "./AuthModal";
import { ReporbitLogo } from "../common/ReporbitLogo";
import { useTheme } from "../../context/ThemeContext";

const SOFT = [0.22, 1, 0.36, 1] as [number, number, number, number];
const reveal = { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.9, ease: SOFT } };

const FEATURES = [
  { t: "Constellation", d: "Real projects with open good-first-issues, ranked against your stack. Every match score is explained." },
  { t: "AI roadmaps", d: "Orbit AI reads the README and CONTRIBUTING guide and writes your path to a first pull request." },
  { t: "Orbit AI", d: "A patient mentor that answers from the repository's own docs and cites them." },
  { t: "Dummy PR", d: "Rehearse first. Orbit AI reviews your code like a maintainer, line by line." },
  { t: "Growth", d: "Connect GitHub. Your contributions, languages and badges are tracked for you." },
];
const STEPS = [
  { t: "Tell us your stack", d: "Languages, tools, experience." },
  { t: "Find your stars", d: "Repositories that fit you, and why." },
  { t: "Follow the roadmap", d: "Setup → issue → code → PR." },
  { t: "Ship it", d: "Practise, then open the real one." },
];
const STACK = ["TypeScript", "Python", "Go", "Rust", "React", "Node.js", "Java", "Kotlin", "C++", "Django", "Next.js", "PostgreSQL"];

// Headline: each word rises out of a mask and un-blurs.
const Words: React.FC<{ text: string; grad?: string[]; delay?: number }> = ({ text, grad = [], delay = 0 }) => (
  <span aria-hidden="true">
    {text.split(" ").map((w, i) => (
      <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.1em] mr-[0.2em]">
        <motion.span className={`inline-block ${grad.includes(w) ? "text-gradient" : ""}`}
          initial={{ y: "110%", filter: "blur(12px)" }} animate={{ y: "0%", filter: "blur(0px)" }}
          transition={{ delay: delay + i * 0.08, duration: 0.9, ease: SOFT }}>{w}</motion.span>
      </span>
    ))}
  </span>
);

// Button that leans toward the cursor.
const Magnetic: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...rest }) => {
  const x = useSpring(0, { stiffness: 250, damping: 15 }); const y = useSpring(0, { stiffness: 250, damping: 15 });
  return (
    <motion.button {...(rest as any)} style={{ x, y }} className={className}
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left - r.width / 2) * 0.25); y.set((e.clientY - r.top - r.height / 2) * 0.35); }}
      onMouseLeave={() => { x.set(0); y.set(0); }} whileTap={{ scale: 0.96 }}>
      {children}
    </motion.button>
  );
};

// Minimal orbit: thin rings, a glowing core and planets — tilts with the cursor.
const Orbit: React.FC<{ mx: MotionValue<number>; my: MotionValue<number> }> = ({ mx, my }) => {
  const rx = useTransform(my, [-1, 1], [14, -14]); const ry = useTransform(mx, [-1, 1], [-14, 14]);
  const rings = [{ i: 0, d: 30, s: 10 }, { i: 16, d: 20, s: 8 }, { i: 31, d: 13, s: 6 }];
  return (
    <motion.div className="relative w-full aspect-square max-w-[460px] mx-auto" style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}>
      {rings.map((r, k) => (
        <React.Fragment key={k}>
          <motion.div className="absolute rounded-full border border-white/15" style={{ inset: `${r.i}%` }}
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + k * 0.15, duration: 1.1, ease: SOFT }} />
          <motion.div className="absolute" style={{ inset: `${r.i}%` }} animate={{ rotate: 360 }} transition={{ duration: r.d, repeat: Infinity, ease: "linear" }}>
            <span className="absolute left-1/2 -top-[5px] -translate-x-1/2 rounded-full bg-gradient-to-br from-white to-tangerine-300 orbit-planet"
              style={{ width: r.s, height: r.s, boxShadow: "0 0 18px 4px rgba(254,133,0,.6)" }} />
          </motion.div>
        </React.Fragment>
      ))}
      <motion.div className="absolute inset-[42%] rounded-full bg-gradient-to-br from-tangerine-300 via-tangerine-500 to-rose-500"
        initial={{ scale: 0 }} animate={{ scale: [0, 1.15, 1] }} transition={{ delay: 0.2, duration: 1, ease: SOFT }}
        style={{ boxShadow: "0 0 120px 30px rgba(254,133,0,.35)" }} />
      <motion.div className="absolute inset-[42%] rounded-full border border-tangerine-300" animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }} />
    </motion.div>
  );
};

export const LandingPage: React.FC = () => {
  const [auth, setAuth] = useState<AuthMode | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(useTransform(mx, [-1, 1], [0, 100]), { stiffness: 60, damping: 20 });
  const sy = useSpring(useTransform(my, [-1, 1], [0, 100]), { stiffness: 60, damping: 20 });
  const spotlight = useTransform([sx, sy] as any, ([x, y]: any) => `radial-gradient(600px circle at ${x}% ${y}%, rgba(254,133,0,0.13), transparent 60%)`);
  const stepsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: stepsP } = useScroll({ target: stepsRef, offset: ["start 80%", "end 60%"] });
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroP, [0, 1], [0, 140]); const heroO = useTransform(heroP, [0, 0.8], [1, 0]);

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden"
      onMouseMove={(e) => { mx.set((e.clientX / window.innerWidth) * 2 - 1); my.set((e.clientY / window.innerHeight) * 2 - 1); }}>
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] z-50 origin-left bg-gradient-to-r from-tangerine-400 to-rose-500" style={{ scaleX: progress }} />
      <motion.div className="pointer-events-none fixed inset-0 z-0" style={{ background: spotlight }} />

      {/* nav */}
      <motion.div className="sticky top-4 z-40 px-4" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: SOFT }}>
        <nav className="liquid-pill max-w-5xl mx-auto rounded-full pl-3 pr-2 py-2 flex items-center justify-between">
          <ReporbitLogo />
          <div className="hidden md:flex items-center gap-7 text-sm text-white/70">
            {[["#features", "Product"], ["#how", "How it works"], ["#ai", "Orbit AI"]].map(([h, l]) => (
              <a key={h} href={h} className="relative hover:text-white group">{l}<span className="absolute -bottom-1 left-0 h-px w-full bg-tangerine-400 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" /></a>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <motion.button whileTap={{ rotate: 180, scale: 0.85 }} onClick={toggleTheme} className="p-2 rounded-full text-white/80 hover:bg-white/10" aria-label="Toggle light / dark mode">{theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}</motion.button>
            <button onClick={() => setAuth("signin")} className="px-4 py-2 rounded-full text-sm text-white/85 hover:text-white">Sign in</button>
            <button onClick={() => setAuth("signup")} className="btn-tangerine px-4 py-2 rounded-full text-sm">Get started</button>
          </div>
        </nav>
      </motion.div>

      {/* hero */}
      <section ref={heroRef} className="relative max-w-6xl mx-auto px-6 pt-20 md:pt-28 pb-24 grid md:grid-cols-[1.25fr,1fr] gap-10 items-center min-h-[86vh]">
        <motion.div style={{ y: heroY, opacity: heroO }}>
          <motion.p initial={{ opacity: 0, letterSpacing: "0.6em" }} animate={{ opacity: 1, letterSpacing: "0.3em" }} transition={{ duration: 1.2, ease: SOFT }}
            className="text-[11px] uppercase text-tangerine-300 font-mono">Open source, made approachable</motion.p>
          <h1 className="mt-6 text-[3.2rem] md:text-7xl lg:text-[5.6rem] font-semibold tracking-[-0.045em] leading-[0.98]" aria-label="Your first contribution, in orbit.">
            <Words text="Your first" delay={0.1} /><br /><Words text="contribution," grad={["contribution,"]} delay={0.3} /><br /><Words text="in orbit." delay={0.5} />
          </h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.9, ease: SOFT }}
            className="mt-7 text-lg text-white/65 max-w-md leading-relaxed">
            Real repositories that fit your skills, and an AI mentor that walks you all the way to a merged pull request.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8, ease: SOFT }} className="mt-9 flex flex-wrap items-center gap-4">
            <Magnetic onClick={() => setAuth("signup")} className="btn-tangerine pl-6 pr-5 py-3.5 rounded-full text-base flex items-center gap-2 group">
              Create your account <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Magnetic>
            <button onClick={() => setAuth("signin")} className="text-sm text-white/70 hover:text-white underline-offset-4 hover:underline">I already have one</button>
          </motion.div>
        </motion.div>
        <Orbit mx={mx} my={my} />
      </section>

      {/* marquee */}
      <div className="relative py-6 border-y border-white/10 overflow-hidden marquee-mask">
        <motion.div className="flex gap-12 whitespace-nowrap w-max text-2xl md:text-3xl font-semibold tracking-tight text-white/25"
          animate={{ x: ["0%", "-50%"] }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}>
          {[...STACK, ...STACK].map((s, i) => <span key={i} className="flex items-center gap-12">{s}<span className="w-1.5 h-1.5 rounded-full bg-tangerine-400" /></span>)}
        </motion.div>
      </div>

      {/* product — minimal list */}
      <section id="features" className="relative max-w-5xl mx-auto px-6 py-28">
        <motion.h2 {...reveal} className="text-4xl md:text-6xl font-semibold tracking-[-0.04em] max-w-3xl">Everything a first-timer needs. <span className="text-white/35">Nothing they don't.</span></motion.h2>
        <div className="mt-16">
          {FEATURES.map((f, i) => (
            <motion.div key={f.t} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: i * 0.06, ease: SOFT }}
              className="group relative grid md:grid-cols-[80px,1fr,1.3fr,auto] items-baseline gap-2 md:gap-8 py-7 border-t border-white/10 last:border-b cursor-default">
              <span className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-tangerine-400 to-rose-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500" />
              <span className="font-mono text-xs text-white/40">0{i + 1}</span>
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight transition-transform duration-500 group-hover:translate-x-2">{f.t}</h3>
              <p className="text-white/60 leading-relaxed">{f.d}</p>
              <ArrowUpRight className="hidden md:block w-5 h-5 text-tangerine-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* how — line draws as you scroll */}
      <section id="how" className="relative max-w-5xl mx-auto px-6 py-24">
        <motion.h2 {...reveal} className="text-4xl md:text-6xl font-semibold tracking-[-0.04em]">Zero to merged.</motion.h2>
        <div ref={stepsRef} className="relative mt-16 grid md:grid-cols-4 gap-10">
          <div className="hidden md:block absolute top-[7px] left-0 right-0 h-px bg-white/10" />
          <motion.div className="hidden md:block absolute top-[7px] left-0 right-0 h-px bg-gradient-to-r from-tangerine-400 to-rose-500 origin-left" style={{ scaleX: stepsP }} />
          {STEPS.map((s, i) => (
            <motion.div key={s.t} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.8, delay: i * 0.12, ease: SOFT }}>
              <span className="relative block w-[15px] h-[15px] rounded-full bg-gradient-to-br from-tangerine-300 to-rose-500 shadow-[0_0_18px_rgba(254,133,0,.7)]" />
              <p className="mt-6 font-mono text-xs text-white/40">Step {i + 1}</p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{s.t}</h3>
              <p className="mt-1.5 text-sm text-white/60">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Orbit AI */}
      <section id="ai" className="relative max-w-5xl mx-auto px-6 py-24">
        <motion.div {...reveal} className="relative rounded-[2.5rem] p-10 md:p-16 overflow-hidden glass-strong">
          <motion.div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-tangerine-500/30 blur-3xl" animate={{ scale: [1, 1.2, 1], x: [0, -30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="absolute -left-16 -bottom-16 w-72 h-72 rounded-full bg-rose-500/20 blur-3xl" animate={{ scale: [1.1, 0.9, 1.1], y: [0, -20, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
          <div className="relative max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-tangerine-300 font-mono">Meet your mentor</p>
            <h2 className="mt-4 text-4xl md:text-6xl font-semibold tracking-[-0.04em]"><span className="text-gradient">Orbit AI</span></h2>
            <p className="mt-5 text-lg text-white/70 leading-relaxed">It reads the docs so you don't get lost. It writes your roadmap, answers your questions and reviews your code. It cites its sources and never makes up links.</p>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative max-w-5xl mx-auto px-6 pt-16 pb-32 text-center">
        <h2 className="text-5xl md:text-8xl font-semibold tracking-[-0.05em] leading-[0.95]">
          {["Ready", "for", "liftoff?"].map((w, i) => (
            <span key={w} className="inline-block overflow-hidden align-bottom mr-[0.2em] pb-[0.08em]">
              <motion.span className={`inline-block ${i === 2 ? "text-gradient" : ""}`} initial={{ y: "110%" }} whileInView={{ y: "0%" }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.9, ease: SOFT }}>{w}</motion.span>
            </span>
          ))}
        </h2>
        <motion.div {...reveal} className="mt-12 flex justify-center">
          <Magnetic onClick={() => setAuth("signup")} className="btn-tangerine pl-8 pr-7 py-4 rounded-full text-lg flex items-center gap-2 group">
            Start for free <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Magnetic>
        </motion.div>
      </section>

      <footer className="relative border-t border-white/10 py-8 text-center text-xs text-white/45">
        <div className="flex items-center justify-center gap-2"><Github className="w-3.5 h-3.5" /> Reporbit · Team Avengers · MIT</div>
      </footer>

      <AuthModal mode={auth} onClose={() => setAuth(null)} onSwitch={setAuth} />
    </div>
  );
};

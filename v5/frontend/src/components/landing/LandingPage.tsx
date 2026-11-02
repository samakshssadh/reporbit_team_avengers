import React, { useState } from "react";
import { motion } from "framer-motion";
import { Compass, Map, Sparkles, GitPullRequest, TrendingUp, ShieldCheck, ArrowRight, Cpu, Github, CheckCircle2 } from "lucide-react";
import { AuthModal, AuthMode } from "./AuthModal";
import { ReporbitLogo } from "../common/ReporbitLogo";
import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } };

const FEATURES = [
  { icon: Compass, title: "Repository Constellation", text: "Real GitHub projects with open good-first-issues, ranked against your stack with a transparent match score — no made-up numbers." },
  { icon: Map, title: "AI Roadmaps", text: "Orbit AI reads each repo's README and CONTRIBUTING guide and writes a step-by-step path to your first pull request, personalised to your stack." },
  { icon: Sparkles, title: "Orbit AI", text: "A friendly mentor that talks like a person. Ask anything — casual or technical — and get answers grounded in the repo's own docs." },
  { icon: GitPullRequest, title: "Dummy PR", text: "Paste code or upload a whole project. Orbit AI reviews it like a maintainer: bugs, fixes and line-by-line comments." },
  { icon: TrendingUp, title: "Your Growth", text: "Track your stack from your first language to your latest framework, plus every contribution you make along the way." },
  { icon: ShieldCheck, title: "Honest by design", text: "Every source is cited, invented links are stripped, and if the AI is offline we tell you — never a fake answer." },
];

const STEPS = [
  { n: "01", t: "Tell us your stack", d: "Pick your languages and tools, your experience and what you do." },
  { n: "02", t: "Explore your constellation", d: "See real repositories that fit you, and why they match." },
  { n: "03", t: "Follow your AI roadmap", d: "Setup, issue choice, implementation and PR — grounded in the repo's own docs." },
  { n: "04", t: "Practice, then ship", d: "Rehearse with a Dummy PR, then open your real first contribution." },
];

// Headline that pops in word by word (slide up + un-blur), with a gradient accent word.
type W = string | { t: string; grad?: boolean };
const WordReveal: React.FC<{ words: W[] }> = ({ words }) => (
  <span aria-hidden="true">
    {words.map((w, i) => {
      const t = typeof w === "string" ? w : w.t; const grad = typeof w !== "string" && w.grad;
      return (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.12em] mr-[0.22em]">
          <motion.span className={`inline-block ${grad ? "text-gradient" : ""}`}
            initial={{ y: "110%", opacity: 0, filter: "blur(8px)", rotate: 4 }} animate={{ y: "0%", opacity: 1, filter: "blur(0px)", rotate: 0 }}
            transition={{ delay: 0.15 + i * 0.09, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>{t}</motion.span>
        </span>
      );
    })}
  </span>
);

// Decorative animated constellation for the hero
const HeroOrbit: React.FC = () => (
  <div className="relative w-full aspect-square max-w-[520px] mx-auto">
    <div className="absolute inset-0 rounded-full border border-white/10" />
    <div className="absolute inset-[12%] rounded-full border border-white/10" />
    <div className="absolute inset-[26%] rounded-full border border-tangerine-400/20" />
    <div className="absolute inset-[40%] rounded-full bg-gradient-to-br from-tangerine-400 via-tangerine-500 to-rose-500 shadow-[0_0_120px_30px_rgba(254,133,0,0.35)] flex items-center justify-center">
      <span className="text-[#1b1d27] font-bold text-sm tracking-wide">ORBIT AI</span>
    </div>
    {[
      { r: 50, d: 26, size: 14, label: "TypeScript", delay: 0 },
      { r: 50, d: 26, size: 10, label: "", delay: -13 },
      { r: 37, d: 18, size: 12, label: "Python", delay: -4 },
      { r: 37, d: 18, size: 8, label: "", delay: -11 },
      { r: 24, d: 12, size: 9, label: "Go", delay: -2 },
    ].map((o, i) => (
      <motion.div key={i} className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: o.d, repeat: Infinity, ease: "linear", delay: o.delay }}>
        <div className="absolute left-1/2" style={{ top: `${50 - o.r}%`, transform: "translate(-50%,-50%)" }}>
          <div className="rounded-full bg-white shadow-[0_0_20px_6px_rgba(254,133,0,0.55)]" style={{ width: o.size, height: o.size }} />
          {o.label && <div className="mt-2 -ml-6 text-[11px] font-mono text-white/70 whitespace-nowrap glass rounded-full px-2 py-0.5">{o.label}</div>}
        </div>
      </motion.div>
    ))}
  </div>
);

export const LandingPage: React.FC = () => {
  const [auth, setAuth] = useState<AuthMode | null>(null);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      {/* Floating liquid-glass nav */}
      <div className="sticky top-4 z-40 px-4">
        <nav className="liquid-pill max-w-6xl mx-auto rounded-full pl-3 pr-2 py-2 flex items-center justify-between">
          <ReporbitLogo />
          <div className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#ai" className="hover:text-white">Orbit AI</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-full text-white/80 hover:bg-white/10" aria-label="Toggle light / dark mode">{theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}</button>
            <button onClick={() => setAuth("signin")} className="px-4 py-2 rounded-full text-sm text-white/85 hover:text-white hover:bg-white/10 transition">Sign in</button>
            <button onClick={() => setAuth("signup")} className="btn-tangerine px-4 py-2 rounded-full text-sm">Create account</button>
          </div>
        </nav>
      </div>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <motion.div {...fade} className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs text-white/80">
            <span className="w-1.5 h-1.5 rounded-full bg-tangerine-400 animate-pulse" /> Meet Orbit AI · your open-source mentor
          </motion.div>
          <h1 className="mt-6 text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.04]" aria-label="Your first open-source contribution, in orbit.">
            <WordReveal words={["Your", "first", { t: "open-source", grad: true }, "contribution,", "in", "orbit."]} />
          </h1>
          <motion.p initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="mt-6 text-lg text-white/65 max-w-xl leading-relaxed">
            Reporbit finds real GitHub projects that match your skills, explains why, and guides you from <em className="text-white/85 not-italic">"where do I start?"</em> to a merged pull request — with Orbit AI by your side.
          </motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.85, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.85, type: "spring", stiffness: 260, damping: 18 }} className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => setAuth("signup")} className="btn-tangerine px-6 py-3.5 rounded-2xl text-base flex items-center gap-2">Get started — it's free <ArrowRight className="w-4 h-4" /></button>
            <button onClick={() => setAuth("signin")} className="glass px-6 py-3.5 rounded-2xl text-base text-white/90 hover:text-white">I have an account</button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.6 }} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55">
            {["Real GitHub data", "AI roadmaps made for you", "Practice PR reviews"].map((t) => (
              <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-tangerine-400" />{t}</span>
            ))}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>
          <HeroOrbit />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative max-w-6xl mx-auto px-6 py-20">
        <motion.div {...fade} className="max-w-2xl">
          <p className="text-tangerine-300 text-sm font-mono uppercase tracking-widest">What Reporbit does</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">Everything a first-time contributor needs.</h2>
        </motion.div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} {...fade} transition={{ ...fade.transition, delay: i * 0.05 }}
              className="group glass rounded-3xl p-6 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-11 h-11 rounded-2xl liquid-lens flex items-center justify-center">
                <f.icon className="w-5 h-5 text-tangerine-200" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative max-w-6xl mx-auto px-6 py-20">
        <motion.h2 {...fade} className="text-4xl md:text-5xl font-semibold tracking-tight">From zero to merged in four steps.</motion.h2>
        <div className="mt-12 grid md:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} {...fade} transition={{ ...fade.transition, delay: i * 0.07 }} className="relative glass rounded-3xl p-6">
              <span className="text-5xl font-semibold text-gradient">{s.n}</span>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-white/60">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Orbit AI */}
      <section id="ai" className="relative max-w-6xl mx-auto px-6 py-20">
        <motion.div {...fade} className="relative glass-strong rounded-[2rem] p-8 md:p-12 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-tangerine-500/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 w-60 h-60 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="relative grid md:grid-cols-[auto,1fr] gap-8 items-center">
            <div className="w-20 h-20 rounded-3xl liquid-lens flex items-center justify-center"><Cpu className="w-9 h-9 text-tangerine-200" /></div>
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Meet <span className="text-gradient">Orbit AI</span> — open, honest, yours.</h2>
              <p className="mt-4 text-white/65 max-w-3xl leading-relaxed">
                Orbit AI does the real work in Reporbit: it writes your contribution roadmap from each repository's own docs, answers your questions like a patient mentor, and reviews your Dummy PRs line by line. It runs on an open-weight model that can even run on your own laptop — and it never invents links or commands: anything not in the real docs is removed.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative max-w-6xl mx-auto px-6 pt-10 pb-24 text-center">
        <motion.h2 {...fade} className="text-4xl md:text-6xl font-semibold tracking-tight">Ready to enter orbit?</motion.h2>
        <motion.p {...fade} className="mt-4 text-white/60">Create an account, pick your stack, and see your constellation in seconds.</motion.p>
        <motion.div {...fade} className="mt-8 flex justify-center gap-3">
          <button onClick={() => setAuth("signup")} className="btn-tangerine px-7 py-3.5 rounded-2xl text-base flex items-center gap-2">Create your account <ArrowRight className="w-4 h-4" /></button>
          <button onClick={() => setAuth("signin")} className="glass px-7 py-3.5 rounded-2xl text-base">Sign in</button>
        </motion.div>
      </section>

      <footer className="relative border-t border-white/10 py-8 text-center text-xs text-white/40">
        <div className="flex items-center justify-center gap-2"><Github className="w-3.5 h-3.5" /> Reporbit · Team Avengers · Hacktoberfest Hack Day Hyderabad 2026 · Code MIT</div>
      </footer>

      <AuthModal mode={auth} onClose={() => setAuth(null)} onSwitch={setAuth} />
    </div>
  );
};

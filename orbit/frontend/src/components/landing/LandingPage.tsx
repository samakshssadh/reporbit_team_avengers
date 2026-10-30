import React, { useState } from "react";
import { motion } from "framer-motion";
import { Compass, Map, Sparkles, GitPullRequest, TrendingUp, ShieldCheck, ArrowRight, Cpu, Github, CheckCircle2 } from "lucide-react";
import { AuthModal, AuthMode } from "./AuthModal";
import { ReporbitLogo } from "../common/ReporbitLogo";

const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } };

const FEATURES = [
  { icon: Compass, title: "Repository Constellation", text: "Real GitHub projects with open good-first-issues, ranked against your stack with a transparent match score — no made-up numbers." },
  { icon: Map, title: "Gemma Roadmaps", text: "Google Gemma reads each repo's README and CONTRIBUTING guide and writes your step-by-step path to a first pull request." },
  { icon: Sparkles, title: "Orbit AI", text: "A friendly mentor that talks like a person. Ask anything — casual or technical — and get answers grounded in the repo's own docs." },
  { icon: GitPullRequest, title: "Dummy PR", text: "Paste your code and open a practice pull request. Gemma reviews it like a maintainer: bugs, fixes and line-by-line comments." },
  { icon: TrendingUp, title: "Your Growth", text: "Track your stack from your first language to your latest framework, plus every contribution you make along the way." },
  { icon: ShieldCheck, title: "Honest by design", text: "Every source is cited, invented links are stripped, and if the AI is offline we tell you — never a fake answer." },
];

const STEPS = [
  { n: "01", t: "Tell us your stack", d: "Pick your languages and tools, your experience and what you do." },
  { n: "02", t: "Explore your constellation", d: "See real repositories that fit you, and why they match." },
  { n: "03", t: "Follow your Gemma roadmap", d: "Setup, issue choice, implementation and PR — grounded in the docs." },
  { n: "04", t: "Practice, then ship", d: "Rehearse with a Dummy PR, then open your real first contribution." },
];

// Decorative animated constellation for the hero
const HeroOrbit: React.FC = () => (
  <div className="relative w-full aspect-square max-w-[520px] mx-auto">
    <div className="absolute inset-0 rounded-full border border-white/10" />
    <div className="absolute inset-[12%] rounded-full border border-white/10" />
    <div className="absolute inset-[26%] rounded-full border border-tangerine-400/20" />
    <div className="absolute inset-[40%] rounded-full bg-gradient-to-br from-tangerine-400 via-tangerine-500 to-rose-500 shadow-[0_0_120px_30px_rgba(254,133,0,0.35)] flex items-center justify-center">
      <span className="text-[#1b1d27] font-bold text-sm tracking-wide">GEMMA</span>
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

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      {/* Floating liquid-glass nav */}
      <div className="sticky top-4 z-40 px-4">
        <nav className="liquid-pill max-w-6xl mx-auto rounded-full pl-3 pr-2 py-2 flex items-center justify-between">
          <ReporbitLogo />
          <div className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#gemma" className="hover:text-white">Gemma</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAuth("signin")} className="px-4 py-2 rounded-full text-sm text-white/85 hover:text-white hover:bg-white/10 transition">Sign in</button>
            <button onClick={() => setAuth("signup")} className="btn-tangerine px-4 py-2 rounded-full text-sm">Create account</button>
          </div>
        </nav>
      </div>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <motion.div {...fade} className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs text-white/80">
            <span className="w-1.5 h-1.5 rounded-full bg-tangerine-400 animate-pulse" /> Powered by Google Gemma · open-weight AI
          </motion.div>
          <motion.h1 {...fade} transition={{ ...fade.transition, delay: 0.05 }} className="mt-6 text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.02]">
            Your first <span className="text-gradient">open-source</span> contribution, in orbit.
          </motion.h1>
          <motion.p {...fade} transition={{ ...fade.transition, delay: 0.1 }} className="mt-6 text-lg text-white/65 max-w-xl leading-relaxed">
            Reporbit finds real GitHub projects that match your skills, explains why, and guides you from <em className="text-white/85 not-italic">"where do I start?"</em> to a merged pull request — with Orbit AI by your side.
          </motion.p>
          <motion.div {...fade} transition={{ ...fade.transition, delay: 0.15 }} className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => setAuth("signup")} className="btn-tangerine px-6 py-3.5 rounded-2xl text-base flex items-center gap-2">Get started — it's free <ArrowRight className="w-4 h-4" /></button>
            <button onClick={() => setAuth("signin")} className="glass px-6 py-3.5 rounded-2xl text-base text-white/90 hover:text-white">I have an account</button>
          </motion.div>
          <motion.div {...fade} transition={{ ...fade.transition, delay: 0.2 }} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55">
            {["Real GitHub data", "Gemma-grounded roadmaps", "Practice PR reviews"].map((t) => (
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

      {/* Gemma */}
      <section id="gemma" className="relative max-w-6xl mx-auto px-6 py-20">
        <motion.div {...fade} className="relative glass-strong rounded-[2rem] p-8 md:p-12 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-tangerine-500/30 blur-3xl" />
          <div className="absolute -left-10 bottom-0 w-60 h-60 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="relative grid md:grid-cols-[auto,1fr] gap-8 items-center">
            <div className="w-20 h-20 rounded-3xl liquid-lens flex items-center justify-center"><Cpu className="w-9 h-9 text-tangerine-200" /></div>
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Built on <span className="text-gradient">Google Gemma</span>, an open-weight model.</h2>
              <p className="mt-4 text-white/65 max-w-3xl leading-relaxed">
                Gemma does the real work in Reporbit: it writes your contribution roadmap from each repository's own docs, powers Orbit AI's answers, and reviews your Dummy PRs line by line. It can run on a laptop through Ollama or via Google AI Studio — and every answer tells you which model produced it.
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
        <div className="flex items-center justify-center gap-2"><Github className="w-3.5 h-3.5" /> Reporbit · Team Avengers · Hacktoberfest Hack Day Hyderabad 2026 · Code MIT · Model: Google Gemma (Gemma Terms of Use)</div>
      </footer>

      <AuthModal mode={auth} onClose={() => setAuth(null)} onSwitch={setAuth} />
    </div>
  );
};

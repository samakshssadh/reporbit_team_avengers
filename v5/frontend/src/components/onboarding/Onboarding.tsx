import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Check, ArrowRight, ArrowLeft, Loader2, Plus, GraduationCap, Briefcase, Laptop, Code, Sparkles, GitPullRequest } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { friendlyError } from "../../services/auth";
import { ReporbitLogo } from "../common/ReporbitLogo";
import { GitHubConnect } from "../common/GitHubConnect";

export const STACK: Record<string, string[]> = {
  Languages: ["Python", "JavaScript", "TypeScript", "Java", "C", "C++", "C#", "Go", "Rust", "Kotlin", "Swift", "Dart", "Ruby", "PHP", "Scala", "R", "Julia", "Lua", "Haskell", "Elixir", "Shell / Bash", "SQL", "HTML & CSS", "Solidity", "MATLAB"],
  Frontend: ["React", "Next.js", "Vue", "Nuxt", "Angular", "Svelte", "Tailwind CSS", "Redux", "Vite", "Three.js"],
  Backend: ["Node.js", "Express", "NestJS", "Django", "Flask", "FastAPI", "Spring Boot", "Ruby on Rails", "Laravel", "ASP.NET", "GraphQL", "gRPC"],
  "Mobile": ["React Native", "Flutter", "Android", "iOS / SwiftUI", "Expo"],
  "Data & AI": ["pandas", "NumPy", "Machine Learning", "PyTorch", "TensorFlow", "scikit-learn", "LLMs", "Hugging Face", "Jupyter", "OpenCV"],
  Databases: ["PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Firebase", "Supabase", "Elasticsearch"],
  "DevOps & Cloud": ["Git", "GitHub Actions", "Docker", "Kubernetes", "Linux", "AWS", "Google Cloud", "Azure", "Terraform", "Nginx", "Vercel"],
  "Testing & Tools": ["Jest", "Vitest", "pytest", "Cypress", "Playwright", "Webpack", "Figma", "VS Code"],
};

const PROFESSIONS = [
  { id: "Student", icon: GraduationCap, hint: "School or college" },
  { id: "Working professional", icon: Briefcase, hint: "Developer / engineer" },
  { id: "Freelancer", icon: Laptop, hint: "Independent work" },
  { id: "Self-taught", icon: Code, hint: "Learning on my own" },
  { id: "Other", icon: Sparkles, hint: "Something else" },
];

const STEPS = ["Tech stack", "Experience", "GitHub"];

export const Onboarding: React.FC = () => {
  const { user, saveProfile, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>(profile?.skills?.length ? profile.skills : []);
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [unit, setUnit] = useState<"months" | "years">("months");
  const [profession, setProfession] = useState<string>("");
  const [otherProfession, setOtherProfession] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (s: string) => setSelected((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : cur.length >= 60 ? cur : [...cur, s]));
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STACK;
    const out: Record<string, string[]> = {};
    for (const [cat, items] of Object.entries(STACK)) {
      const m = items.filter((i) => i.toLowerCase().includes(q));
      if (m.length) out[cat] = m;
    }
    return out;
  }, [query]);
  const allItems = useMemo(() => Object.values(STACK).flat().map((s) => s.toLowerCase()), []);
  const canAddCustom = query.trim().length >= 2 && !allItems.includes(query.trim().toLowerCase()) && !selected.includes(query.trim());

  const months = (() => {
    const n = Number(amount);
    if (!amount || Number.isNaN(n) || n < 0) return null;
    return Math.min(720, Math.round(unit === "years" ? n * 12 : n));
  })();
  const level = months === null ? null : months < 12 ? "Beginner" : months < 36 ? "Intermediate" : "Advanced";

  const canNext = step === 0 ? selected.length > 0 : step === 1 ? months !== null && !!profession && (profession !== "Other" || otherProfession.trim().length > 1) : true;

  const finish = async () => {
    setBusy(true); setError(null);
    try {
      await saveProfile({
        skills: selected,
        experienceMonths: months ?? 0,
        profession: profession === "Other" ? otherProfession.trim() : profession,
        onboarded: true,
      });
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  const chip = (on: boolean) => `px-3.5 py-2 rounded-full text-sm border transition-all ${on
    ? "liquid-lens text-white border-tangerine-300/50 shadow-[0_0_20px_-6px_rgba(254,133,0,0.8)]"
    : "bg-white/[0.04] border-white/10 text-white/75 hover:bg-white/[0.08] hover:text-white"}`;

  return (
    <div className="relative min-h-screen text-white flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl w-full mx-auto">
        <ReporbitLogo />
        <span className="text-sm text-white/50">Hi {user?.displayName?.split(" ")[0] || "there"} 👋</span>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pb-10">
        {/* progress */}
        <div className="flex items-center gap-3 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-tangerine-400 to-rose-500" initial={false} animate={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }} />
              </div>
              <p className={`mt-2 text-xs ${i <= step ? "text-white/80" : "text-white/35"}`}>{i + 1}. {s}</p>
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-[2rem] p-6 sm:p-10 min-h-[460px]">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.section key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">What's in your <span className="text-gradient">tech stack</span>?</h1>
                <p className="mt-2 text-white/60">Pick everything you've used or are learning. We use this to find repositories that fit you.</p>
                <div className="mt-6 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 90+ languages, frameworks and tools…"
                    className="w-full pl-11 pr-32 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:outline-none focus:border-tangerine-400/60 focus:ring-4 focus:ring-tangerine-500/15 placeholder:text-white/35" />
                  {canAddCustom && (
                    <button onClick={() => { toggle(query.trim()); setQuery(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl text-xs liquid-lens flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add "{query.trim()}"</button>
                  )}
                </div>
                {selected.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-white/50 mr-1">{selected.length} selected:</span>
                    {selected.map((s) => <button key={s} onClick={() => toggle(s)} className="px-2.5 py-1 rounded-full text-xs bg-tangerine-500/20 text-tangerine-100 border border-tangerine-400/30 hover:bg-tangerine-500/30">{s} ✕</button>)}
                  </div>
                )}
                <div className="mt-6 space-y-6 max-h-[46vh] overflow-y-auto pr-2">
                  {Object.entries(filtered).map(([cat, items]) => (
                    <div key={cat}>
                      <h3 className="text-xs uppercase tracking-widest text-white/45 font-mono mb-3">{cat}</h3>
                      <div className="flex flex-wrap gap-2">
                        {items.map((s) => (
                          <button key={s} onClick={() => toggle(s)} className={chip(selected.includes(s))} aria-pressed={selected.includes(s)}>
                            {selected.includes(s) && <Check className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}{s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {Object.keys(filtered).length === 0 && <p className="text-white/50 text-sm">No matches — use “Add” to include it anyway.</p>}
                </div>
              </motion.section>
            )}

            {step === 1 && (
              <motion.section key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">How long have you been <span className="text-gradient">coding</span>?</h1>
                <p className="mt-2 text-white/60">Months or years — whatever's easier.</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <input type="number" min={0} max={unit === "years" ? 60 : 720} step={unit === "years" ? 0.5 : 1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 8"
                    className="w-36 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-2xl font-semibold focus:outline-none focus:border-tangerine-400/60 focus:ring-4 focus:ring-tangerine-500/15" aria-label="Amount of experience" />
                  <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/10">
                    {(["months", "years"] as const).map((u) => (
                      <button key={u} onClick={() => setUnit(u)} className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize ${unit === u ? "liquid-lens" : "text-white/60 hover:text-white"}`}>{u}</button>
                    ))}
                  </div>
                  {level && <span className="ml-1 text-sm text-white/60">→ we'll treat you as <strong className="text-tangerine-300">{level}</strong></span>}
                </div>

                <h2 className="mt-10 text-xl font-semibold">What do you do?</h2>
                <div className="mt-4 grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {PROFESSIONS.map((p) => (
                    <button key={p.id} onClick={() => setProfession(p.id)} aria-pressed={profession === p.id}
                      className={`text-left p-4 rounded-2xl border transition-all ${profession === p.id ? "liquid-lens border-tangerine-300/50" : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"}`}>
                      <p.icon className={`w-5 h-5 ${profession === p.id ? "text-tangerine-200" : "text-white/60"}`} />
                      <div className="mt-3 font-medium text-sm">{p.id}</div>
                      <div className="text-xs text-white/50">{p.hint}</div>
                    </button>
                  ))}
                </div>
                {profession === "Other" && (
                  <input value={otherProfession} onChange={(e) => setOtherProfession(e.target.value)} maxLength={80} placeholder="Tell us your profession"
                    className="mt-4 w-full sm:w-96 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:outline-none focus:border-tangerine-400/60" />
                )}
              </motion.section>
            )}

            {step === 2 && (
              <motion.section key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Connect your <span className="text-gradient">GitHub</span></h1>
                <p className="mt-2 text-white/60">Reporbit reads your contributions straight from GitHub — your past pull requests and issues show up automatically, and new ones are picked up as you make them. Optional: you can connect later from your profile.</p>
                <div className="mt-6 max-w-xl"><GitHubConnect compact /></div>
                <div className="mt-10 glass rounded-2xl p-5 text-sm text-white/70">
                  <p className="font-medium text-white">Your profile</p>
                  <p className="mt-2"><span className="text-white/45">Stack:</span> {selected.slice(0, 12).join(", ")}{selected.length > 12 ? ` +${selected.length - 12} more` : ""}</p>
                  <p><span className="text-white/45">Experience:</span> {amount} {unit} ({level}) · {profession === "Other" ? otherProfession : profession}</p>
                </div>
                {error && <div className="mt-4 text-sm text-rose-300 bg-rose-500/10 border border-rose-400/20 rounded-xl px-3 py-2" role="alert">{error}</div>}
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="px-5 py-3 rounded-2xl text-sm text-white/70 hover:text-white disabled:opacity-0 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
          {step < 2 ? (
            <button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="btn-tangerine px-6 py-3 rounded-2xl text-sm flex items-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
          ) : (
            <button onClick={finish} disabled={busy} className="btn-tangerine px-6 py-3 rounded-2xl text-sm flex items-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Enter Reporbit <ArrowRight className="w-4 h-4" /></>}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

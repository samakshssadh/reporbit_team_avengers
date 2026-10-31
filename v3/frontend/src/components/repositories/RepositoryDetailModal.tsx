import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Repository } from "../../types";
import { X, ExternalLink, Sparkles, Map, Star, GitFork, Clock, Users, Activity, GitMerge, CircleDot, FileText, Layers, CheckCircle2 } from "lucide-react";
import { formatNumber, formatRelativeTime, isSafeUrl } from "../../lib/utils";
import { track } from "../../services/track";

interface RepositoryDetailModalProps {
  repository: Repository | null;
  onClose: () => void;
  onExplainWithAI: (repo: Repository) => void;
  onProceedWithRoadmap: (repo: Repository) => void;
}

const TABS = ["Overview", "Why it fits you", "Good first issues"] as const;
type Tab = typeof TABS[number];

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const r = 42, c = 2 * Math.PI * r;
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffb15c" /><stop offset="60%" stopColor="#fe8500" /><stop offset="100%" stopColor="#ff3b66" /></linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
        <motion.circle cx="50" cy="50" r={r} stroke="url(#ring)" strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - score / 100) }} transition={{ duration: 1, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-white">{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-white/50">match</span>
      </div>
    </div>
  );
};

const Bar: React.FC<{ label: string; value: number; max: number }> = ({ label, value, max }) => (
  <div>
    <div className="flex justify-between text-sm mb-1.5"><span className="text-white/75">{label}</span><span className="font-mono text-tangerine-200">{value}/{max}</span></div>
    <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
      <motion.div className="h-full rounded-full bg-gradient-to-r from-tangerine-400 to-rose-500" initial={{ width: 0 }} animate={{ width: `${Math.round((value / max) * 100)}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
    </div>
  </div>
);

const Stat: React.FC<{ icon: React.FC<{ className?: string }>; label: string; value: React.ReactNode }> = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
    <div className="flex items-center gap-2 text-xs text-white/50"><Icon className="w-3.5 h-3.5 text-tangerine-300" />{label}</div>
    <div className="mt-1.5 text-white font-medium text-sm">{value}</div>
  </div>
);

const DIFF_STYLE: Record<string, string> = { Easy: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20", Medium: "bg-tangerine-500/15 text-tangerine-200 border-tangerine-400/25", Hard: "bg-rose-500/15 text-rose-300 border-rose-400/25" };

export const RepositoryDetailModal: React.FC<RepositoryDetailModalProps> = ({ repository, onClose, onExplainWithAI, onProceedWithRoadmap }) => {
  const [tab, setTab] = useState<Tab>("Overview");
  const contribKey = repository ? `reporbit_contrib:${repository.id}` : "";
  const [contributed, setContributed] = useState(false);
  useEffect(() => { setContributed(!!(contribKey && localStorage.getItem(contribKey))); }, [contribKey]);
  const toggleContributed = () => {
    if (!repository) return;
    if (contributed) { track.unContribute(repository.id).catch(() => {}); localStorage.removeItem(contribKey); setContributed(false); }
    else { track.repo(repository, "contributed"); localStorage.setItem(contribKey, "1"); setContributed(true); }
  };
  useEffect(() => { setTab("Overview"); }, [repository?.id]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && repository) onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [repository, onClose]);

  return (
    <AnimatePresence>
      {repository && (
        <motion.div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-6 bg-black/55 backdrop-blur-md"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-labelledby="repo-detail-title" onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-5xl sm:h-[88vh] h-full glass-strong sm:rounded-[2rem] overflow-hidden flex flex-col"
            initial={{ y: 40, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", stiffness: 240, damping: 26 }}>
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-tangerine-500/20 blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative px-6 sm:px-10 pt-8 pb-6 flex flex-col sm:flex-row gap-6 sm:items-center">
              <ScoreRing score={repository.matchScore} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <span>{repository.owner}</span><span>/</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-tangerine-500/15 text-tangerine-200 border border-tangerine-400/25">{repository.difficulty}</span>
                </div>
                <h2 id="repo-detail-title" className="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight text-white truncate">{repository.name}</h2>
                <p className="mt-2 text-white/65 leading-relaxed line-clamp-2">{repository.description || "No description provided."}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {repository.platform && repository.platform !== "github" && <span className="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-400/25 text-rose-100 capitalize">{repository.platform}</span>}
                  {!repository.starsUnknown && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10"><Star className="w-3 h-3 text-tangerine-300" />{formatNumber(repository.stars)}</span>}
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10"><GitFork className="w-3 h-3" />{formatNumber(repository.forks)}</span>
                  {repository.languages.slice(0, 5).map((l) => (
                    <span key={l} className={`px-2.5 py-1 rounded-full border ${repository.matchedSkills.includes(l) ? "bg-tangerine-500/20 border-tangerine-400/30 text-tangerine-100" : "bg-white/5 border-white/10 text-white/70"}`}>{l}</span>
                  ))}
                </div>
              </div>
              <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            {/* Tabs */}
            <div className="relative px-6 sm:px-10 border-b border-white/10 flex gap-1">
              {TABS.map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`relative px-4 py-3 text-sm font-medium transition-colors ${tab === t ? "text-white" : "text-white/50 hover:text-white/80"}`}>
                  {t}{t === "Good first issues" ? ` (${repository.goodFirstIssuesCount})` : ""}
                  {tab === t && <motion.span layoutId="repo-tab" className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-tangerine-400 to-rose-500" />}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="relative flex-1 overflow-y-auto px-6 sm:px-10 py-8">
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                  {tab === "Overview" && (
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-xs uppercase tracking-widest text-white/45 font-mono mb-3">Maintainer health</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Stat icon={Clock} label="Median time to merge" value={repository.maintainerMetrics.medianReviewTime} />
                          <Stat icon={GitMerge} label="Merge ratio" value={repository.maintainerMetrics.mergeRatio} />
                          <Stat icon={Users} label="Active maintainers" value={repository.maintainerMetrics.activeMaintainers || "Not measured"} />
                          <Stat icon={Activity} label="Cadence" value={repository.maintainerMetrics.cadence} />
                        </div>
                      </section>
                      <section className="grid md:grid-cols-3 gap-3">
                        <Stat icon={Layers} label="Setup complexity (est.)" value={repository.setupComplexity} />
                        <Stat icon={FileText} label="Docs" value={repository.readmeCoverage} />
                        <Stat icon={Clock} label="Last activity" value={repository.recentUpdate ? formatRelativeTime(repository.recentUpdate) : "Unknown"} />
                      </section>
                      {repository.topics?.length > 0 && (
                        <section>
                          <h3 className="text-xs uppercase tracking-widest text-white/45 font-mono mb-3">Topics</h3>
                          <div className="flex flex-wrap gap-2">{repository.topics.map((t) => <span key={t} className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/70">#{t}</span>)}</div>
                        </section>
                      )}
                    </div>
                  )}

                  {tab === "Why it fits you" && (
                    <div className="grid md:grid-cols-[1fr,1.1fr] gap-8">
                      <div className="space-y-5">
                        <Bar label="Tech stack overlap" value={repository.scoreBreakdown.techStackOverlap} max={40} />
                        <Bar label="Difficulty fit" value={repository.scoreBreakdown.difficultyFit} max={25} />
                        <Bar label="Activity & responsiveness" value={repository.scoreBreakdown.activityAndResponsiveness} max={20} />
                        <Bar label="Documentation quality" value={repository.scoreBreakdown.documentationQuality} max={15} />
                      </div>
                      <div className="rounded-3xl liquid-lens p-6">
                        <p className="text-xs uppercase tracking-widest text-tangerine-100/80 font-mono">In plain words</p>
                        <p className="mt-3 text-white/90 leading-relaxed">{repository.scoreBreakdown.explanation}</p>
                        {repository.matchedSkills.length > 0 && (
                          <p className="mt-4 text-sm text-white/70">Your matching skills: <strong className="text-white">{repository.matchedSkills.join(", ")}</strong></p>
                        )}
                      </div>
                    </div>
                  )}

                  {tab === "Good first issues" && (
                    <div className="space-y-3">
                      {repository.sampleIssues?.length ? repository.sampleIssues.map((iss) => (
                        <a key={iss.id} href={isSafeUrl(iss.url) ? iss.url : "#"} target="_blank" rel="noopener noreferrer"
                          className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-tangerine-400/40 hover:bg-white/[0.07] transition">
                          <CircleDot className="w-5 h-5 mt-0.5 text-emerald-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium group-hover:text-tangerine-100">{iss.title}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="text-xs text-white/40 font-mono">#{iss.number}</span>
                              {iss.labels.slice(0, 4).map((l) => <span key={l} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">{l}</span>)}
                            </div>
                          </div>
                          <span className={`text-[11px] px-2.5 py-1 rounded-full border ${DIFF_STYLE[iss.difficulty] || DIFF_STYLE.Medium}`}>{iss.difficulty}</span>
                          <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-tangerine-300 mt-0.5" />
                        </a>
                      )) : <p className="text-white/50">No open beginner issues right now.</p>}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sticky actions */}
            <div className="relative px-6 sm:px-10 py-4 border-t border-white/10 bg-black/10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <a href={isSafeUrl(repository.url) ? repository.url : "#"} target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 hover:text-white flex items-center gap-1.5"><ExternalLink className="w-4 h-4" /> View on {repository.platform === "gitlab" ? "GitLab" : repository.platform === "bitbucket" ? "Bitbucket" : "GitHub"}</a>
                <button onClick={toggleContributed} className={`text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition ${contributed ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200" : "border-white/15 text-white/60 hover:text-white"}`}>
                  <CheckCircle2 className="w-4 h-4" /> {contributed ? "Contributed ✓" : "I contributed here"}
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => onExplainWithAI(repository)} className="glass px-5 py-3 rounded-2xl text-sm text-white flex items-center gap-2 hover:bg-white/10"><Sparkles className="w-4 h-4 text-tangerine-300" /> Ask Orbit AI</button>
                <button onClick={() => onProceedWithRoadmap(repository)} className="btn-tangerine px-5 py-3 rounded-2xl text-sm flex items-center gap-2"><Map className="w-4 h-4" /> Generate roadmap</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

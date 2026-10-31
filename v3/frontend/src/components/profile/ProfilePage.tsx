import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Compass, BookOpen, GitPullRequest, TrendingUp, ArrowRight, Award, Loader2, Map, Sparkles, CheckCircle2, Flame, Briefcase, Calendar } from "lucide-react";
import { api } from "../../services/auth";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

interface Dashboard {
  timeSpent: { totalSeconds: number; todaySeconds: number; last7DaysSeconds: number; daysTracked: number };
  repos: { explored: number; roadmaps: number; askedAI: number; contributed: number; list: { repoId: string; repoName: string; platform: string; kinds: Record<string, number>; lastAt: string }[] };
  topics: { learning: string[]; learned: string[]; explored: { topic: string; count: number }[]; total: number };
  dummyPRs: { reviewed: number; approved: number };
  heatmap: { date: string; minutes: number; contributions: number; milestones: number; level: number }[];
  activeDays: number;
  growth: any;
  thenVsNow: { since: string; daysSince: number; then: any; now: any; newSkills: string[] };
  profile: { profession: string | null; experienceMonths: number | null; priorContributions: number; joinedAt: string };
}

const fmtDur = (s: number) => { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h}h ${m}m` : `${m}m`; };
const fmtExp = (m: number | null | undefined) => (m == null ? "—" : m < 12 ? `${m} mo` : `${(m / 12).toFixed(m % 12 ? 1 : 0)} yr`);
const LEVEL_BG = ["bg-white/[0.05]", "bg-tangerine-900/80", "bg-tangerine-700", "bg-tangerine-500", "bg-tangerine-300"];
const fade = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05, duration: 0.45 } });

const StatCard: React.FC<{ icon: React.FC<{ className?: string }>; label: string; value: React.ReactNode; sub?: React.ReactNode; i?: number }> = ({ icon: Icon, label, value, sub, i = 0 }) => (
  <motion.div {...fade(i)} className="glass rounded-3xl p-5">
    <div className="flex items-center gap-2 text-xs text-white/55"><span className="w-8 h-8 rounded-xl liquid-lens flex items-center justify-center"><Icon className="w-4 h-4 text-tangerine-100" /></span>{label}</div>
    <div className="mt-3 text-3xl font-semibold text-white tracking-tight">{value}</div>
    {sub && <div className="mt-1 text-xs text-white/50">{sub}</div>}
  </motion.div>
);

const Heatmap: React.FC<{ cells: Dashboard["heatmap"] }> = ({ cells }) => {
  const weeks: Dashboard["heatmap"][] = [];
  cells.forEach((c, i) => { const w = Math.floor(i / 7); (weeks[w] ||= []).push(c); });
  const months: { label: string; col: number }[] = [];
  weeks.forEach((w, i) => { const d = new Date(w[0].date); if (d.getUTCDate() <= 7) months.push({ label: d.toLocaleString("en", { month: "short", timeZone: "UTC" }), col: i }); });
  return (
    <div className="overflow-x-auto">
      <div className="relative inline-block pt-5">
        {months.map((m) => <span key={m.col} className="absolute top-0 text-[10px] text-white/40" style={{ left: m.col * 14 }}>{m.label}</span>)}
        <div className="flex gap-[3px]">
          {weeks.map((w, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {w.map((c) => (
                <div key={c.date} className={`w-[11px] h-[11px] rounded-[3px] ${LEVEL_BG[c.level]} ${c.level >= 3 ? "shadow-[0_0_6px_rgba(254,133,0,0.6)]" : ""}`}
                  title={`${c.date}: ${c.minutes} min on Reporbit · ${c.contributions} contribution(s) · ${c.milestones} skill update(s)`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-white/40">Less {LEVEL_BG.map((b, i) => <span key={i} className={`w-[11px] h-[11px] rounded-[3px] ${b}`} />)} More</div>
    </div>
  );
};

// Area chart of cumulative XP with skills-known line, by month.
const GrowthChart: React.FC<{ monthly: any[] }> = ({ monthly }) => {
  const data = monthly.slice(-18);
  if (data.length < 2) return <p className="text-sm text-white/50">Your growth curve appears after a little more activity — keep going!</p>;
  const W = 640, H = 200, P = 28;
  const maxXp = Math.max(1, ...data.map((d) => d.xpCumulative));
  const maxSk = Math.max(1, ...data.map((d) => d.skillsKnownCumulative));
  const x = (i: number) => P + (i / (data.length - 1)) * (W - P * 2);
  const yx = (v: number) => H - P - (v / maxXp) * (H - P * 2);
  const ys = (v: number) => H - P - (v / maxSk) * (H - P * 2);
  const xpLine = data.map((d, i) => `${x(i)},${yx(d.xpCumulative)}`).join(" ");
  const skLine = data.map((d, i) => `${x(i)},${ys(d.skillsKnownCumulative)}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Growth over time">
        <defs>
          <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fe8500" stopOpacity="0.45" /><stop offset="100%" stopColor="#fe8500" stopOpacity="0" /></linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={P} x2={W - P} y1={H - P - f * (H - P * 2)} y2={H - P - f * (H - P * 2)} stroke="rgba(255,255,255,0.06)" />)}
        <polygon points={`${x(0)},${H - P} ${xpLine} ${x(data.length - 1)},${H - P}`} fill="url(#xpFill)" />
        <polyline points={xpLine} fill="none" stroke="#fe8500" strokeWidth="2.5" strokeLinejoin="round" />
        <polyline points={skLine} fill="none" stroke="#ff7aa0" strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" />
        {data.map((d, i) => (i === 0 || i === data.length - 1 || i % 3 === 0) && <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.45)">{d.month.slice(2)}</text>)}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-white/55"><span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-tangerine-500" />XP (cumulative, max {maxXp})</span><span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-rose-400" />Skills known (max {maxSk})</span></div>
    </div>
  );
};

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { setActiveTab } = useApp();
  const [d, setD] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api<Dashboard>("/me/dashboard").then((x) => alive && setD(x)).catch((e) => alive && setError(e?.message || "Could not load your profile"));
    return () => { alive = false; };
  }, []);

  const initials = (user?.displayName || "U").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const g = d?.growth;
  const evolution = useMemo(() => g?.evolution?.path || [], [g]);

  if (error) return <div className="max-w-6xl mx-auto px-6 py-16 text-center text-rose-300">{error}</div>;
  if (!d) return <div className="max-w-6xl mx-auto px-6 py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-tangerine-400" /></div>;

  const tvn = d.thenVsNow;
  const compare = [
    { label: "Skills", then: tvn.then.skillCount, now: tvn.now.skillCount },
    { label: "Contributions", then: tvn.then.contributions, now: tvn.now.contributions },
    { label: "Experience", then: fmtExp(tvn.then.experienceMonths), now: fmtExp(tvn.now.experienceMonths) },
    { label: "Level", then: `Lv ${tvn.then.level}`, now: `Lv ${tvn.now.level}` },
    { label: "Repos explored", then: tvn.then.reposExplored, now: tvn.now.reposExplored },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Hero */}
      <motion.section {...fade()} className="relative glass-strong rounded-[2rem] p-6 sm:p-8 overflow-hidden">
        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-tangerine-500/25 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-tangerine-300 via-tangerine-500 to-rose-500 flex items-center justify-center text-3xl font-bold text-[#1b1d27] shadow-[0_0_40px_-4px_rgba(254,133,0,0.7)]">{initials}</div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">{user?.displayName}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/60">
              {d.profile.profession && <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10"><Briefcase className="w-3 h-3" />{d.profile.profession}</span>}
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10"><Calendar className="w-3 h-3" />Joined {new Date(d.profile.joinedAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10"><Flame className="w-3 h-3 text-tangerine-300" />{d.activeDays} active day{d.activeDays === 1 ? "" : "s"}</span>
            </div>
          </div>
          <div className="md:w-72">
            <div className="flex items-baseline justify-between"><span className="text-sm text-white/60">Level {g.level.level}</span><span className="text-gradient font-semibold">{g.level.title}</span></div>
            <div className="mt-2 h-2.5 rounded-full bg-white/10 overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-tangerine-400 to-rose-500" initial={{ width: 0 }} animate={{ width: `${Math.round(g.level.progress * 100)}%` }} transition={{ duration: 1 }} /></div>
            <p className="mt-1.5 text-xs text-white/45">{g.level.xp} XP · {g.level.nextLevelXp - g.level.xp} XP to level {g.level.level + 1}</p>
          </div>
        </div>
      </motion.section>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard i={1} icon={Clock} label="Time on Reporbit" value={fmtDur(d.timeSpent.totalSeconds)} sub={`Today ${fmtDur(d.timeSpent.todaySeconds)} · last 7 days ${fmtDur(d.timeSpent.last7DaysSeconds)}`} />
        <StatCard i={2} icon={Compass} label="Repositories" value={d.repos.explored} sub={`${d.repos.roadmaps} roadmaps · ${d.repos.contributed} contributed`} />
        <StatCard i={3} icon={BookOpen} label="Topics" value={d.topics.total} sub={`${d.topics.learning.length} learning · ${d.topics.learned.length} learned`} />
        <StatCard i={4} icon={GitPullRequest} label="Dummy PRs reviewed" value={d.dummyPRs.reviewed} sub={`${d.dummyPRs.approved} approved by Gemma`} />
      </div>

      {/* Heatmap */}
      <motion.section {...fade(5)} className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-white flex items-center gap-2"><Flame className="w-4 h-4 text-tangerine-300" />Activity</h2><span className="text-xs text-white/45">Time on site, contributions & skill updates — last 12 months</span></div>
        <Heatmap cells={d.heatmap} />
      </motion.section>

      {/* Then vs now */}
      <motion.section {...fade(6)} className="glass-strong rounded-3xl p-6">
        <h2 className="font-semibold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-tangerine-300" />Where you were → where you are</h2>
        <p className="text-xs text-white/45 mt-1">Since {new Date(tvn.since).toLocaleDateString()} ({tvn.daysSince} days)</p>
        <div className="mt-5 grid md:grid-cols-[1fr,auto,1fr] gap-4 items-stretch">
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
            <p className="text-xs uppercase tracking-widest text-white/45 font-mono">Then</p>
            <div className="mt-3 space-y-2">{compare.map((c) => <div key={c.label} className="flex justify-between text-sm"><span className="text-white/55">{c.label}</span><span className="text-white/80">{c.then}</span></div>)}</div>
            <div className="mt-4 flex flex-wrap gap-1.5">{tvn.then.skills.slice(0, 10).map((s: string) => <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">{s}</span>)}</div>
          </div>
          <div className="hidden md:flex items-center"><ArrowRight className="w-8 h-8 text-tangerine-400" /></div>
          <div className="rounded-2xl liquid-lens p-5">
            <p className="text-xs uppercase tracking-widest text-tangerine-100/80 font-mono">Now</p>
            <div className="mt-3 space-y-2">{compare.map((c) => <div key={c.label} className="flex justify-between text-sm"><span className="text-white/70">{c.label}</span><span className="text-white font-semibold">{c.now}</span></div>)}</div>
            {tvn.newSkills.length > 0 && <div className="mt-4"><p className="text-xs text-tangerine-100/80 mb-1.5">New since you joined</p><div className="flex flex-wrap gap-1.5">{tvn.newSkills.map((s) => <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-tangerine-500/25 border border-tangerine-300/30 text-white">+ {s}</span>)}</div></div>}
          </div>
        </div>
      </motion.section>

      {/* Growth */}
      <div className="grid lg:grid-cols-[1.4fr,1fr] gap-6">
        <motion.section {...fade(7)} className="glass rounded-3xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-tangerine-300" />Growth</h2>
          <GrowthChart monthly={g.monthly} />
          {g.insights?.length > 0 && <ul className="mt-4 space-y-1.5 text-sm text-white/70">{g.insights.slice(0, 4).map((t: string, i: number) => <li key={i} className="flex gap-2"><Sparkles className="w-3.5 h-3.5 mt-1 text-tangerine-300 shrink-0" />{t}</li>)}</ul>}
        </motion.section>
        <motion.section {...fade(8)} className="glass rounded-3xl p-6">
          <h2 className="font-semibold text-white mb-4">Your stack journey</h2>
          {evolution.length ? (
            <ol className="relative border-l border-white/10 ml-2 space-y-3">
              {evolution.map((s: any) => (
                <li key={s.slug} className="ml-4">
                  <span className={`absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full ${s.status === "learned" ? "bg-tangerine-400" : "bg-white/30"}`} />
                  <p className="text-sm text-white">{s.skill} <span className="text-[11px] text-white/40">{s.status}</span></p>
                  <p className="text-[11px] text-white/40">{s.startedAt}{s.gapDaysFromPrevious != null ? ` · +${s.gapDaysFromPrevious}d` : ""}</p>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-white/50">Add skills to see your journey.</p>}
        </motion.section>
      </div>

      {/* Repos + topics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.section {...fade(9)} className="glass rounded-3xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Compass className="w-4 h-4 text-tangerine-300" />Your repositories</h2>
          {d.repos.list.length ? (
            <ul className="space-y-2">
              {d.repos.list.slice(0, 10).map((r) => (
                <li key={r.repoId} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div className="min-w-0"><p className="text-sm text-white truncate">{r.repoName}</p><p className="text-[11px] text-white/40 capitalize">{r.platform} · {new Date(r.lastAt).toLocaleDateString()}</p></div>
                  <div className="flex gap-1 shrink-0">
                    {r.kinds.contributed && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Contributed</span>}
                    {r.kinds.roadmap && <span className="text-[10px] px-2 py-0.5 rounded-full bg-tangerine-500/20 text-tangerine-200 flex items-center gap-1"><Map className="w-3 h-3" />Roadmap</span>}
                    {r.kinds.chat && <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200">AI</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : <button onClick={() => setActiveTab("repositories")} className="text-sm text-tangerine-300 hover:text-tangerine-200">Explore your constellation →</button>}
        </motion.section>
        <motion.section {...fade(10)} className="glass rounded-3xl p-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-tangerine-300" />Topics</h2>
          {[["Learning now", d.topics.learning, "bg-tangerine-500/20 border-tangerine-400/30 text-tangerine-100"], ["Learned", d.topics.learned, "bg-emerald-500/15 border-emerald-400/25 text-emerald-100"]].map(([label, items, cls]) => (
            <div key={label as string} className="mb-4">
              <p className="text-xs text-white/45 mb-2">{label as string}</p>
              <div className="flex flex-wrap gap-1.5">{(items as string[]).length ? (items as string[]).map((t) => <span key={t} className={`text-xs px-2.5 py-1 rounded-full border ${cls}`}>{t}</span>) : <span className="text-xs text-white/35">None yet</span>}</div>
            </div>
          ))}
          <p className="text-xs text-white/45 mb-2">Explored in Learn</p>
          <div className="flex flex-wrap gap-1.5">{d.topics.explored.length ? d.topics.explored.map((t) => <span key={t.topic} className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">{t.topic} <span className="text-white/35">×{t.count}</span></span>) : <span className="text-xs text-white/35">Search a topic in Learn to start</span>}</div>
        </motion.section>
      </div>

      {/* Badges */}
      <motion.section {...fade(11)} className="glass rounded-3xl p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-tangerine-300" />Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {g.badges.map((b: any) => (
            <div key={b.id} className={`rounded-2xl p-3 text-center border ${b.earned ? "liquid-lens" : "bg-white/[0.03] border-white/10 opacity-50"}`} title={b.description}>
              <Award className={`w-6 h-6 mx-auto ${b.earned ? "text-tangerine-200" : "text-white/40"}`} />
              <p className="mt-1.5 text-xs text-white">{b.name}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

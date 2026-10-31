// Growth Engine: turns a user's skills, skill events and contributions into an explainable
// growth story — XP & levels, per-skill mastery, streaks, momentum, heatmap, monthly curve,
// milestone journey, language evolution path, badges and next-skill recommendations.
// Pure function (no DB, no AI) so it is deterministic and unit-testable.
import { recommendNextSkills, skillInfo } from './skillGraph.js';

const DAY = 86400e3;

export const XP_RULES = {
  contribution: { pull_request: 40, issue: 15, commit: 5, review: 20, docs: 25, discussion: 8, other: 5 },
  statusMultiplier: { merged: 1.5, completed: 1.0, open: 0.6, draft: 0.3, closed: 0.4 },
  skillLearned: 50, perProficiencyPoint: 10,
};

export const LEVELS = [
  { level: 1, title: 'Explorer' },
  { level: 2, title: 'Tinkerer' },
  { level: 3, title: 'First-timer' },
  { level: 4, title: 'Contributor' },
  { level: 5, title: 'Builder' },
  { level: 6, title: 'Collaborator' },
  { level: 7, title: 'Maintainer-in-training' },
  { level: 8, title: 'Open-source Champion' },
];
// Cumulative XP needed to *reach* level n: 50*(n-1)*n  -> L2=100, L3=300, L4=600, L5=1000 ...
export const xpForLevel = (n) => 50 * (n - 1) * n;

export function levelFor(xp) {
  let n = 1;
  while (xpForLevel(n + 1) <= xp) n++;
  const title = (LEVELS.find((l) => l.level === n) || LEVELS[LEVELS.length - 1]).title;
  const cur = xpForLevel(n), nxt = xpForLevel(n + 1);
  return { level: n, title, xp, currentLevelXp: cur, nextLevelXp: nxt, progress: Math.round(((xp - cur) / (nxt - cur)) * 100) / 100 };
}

export function contributionXp(c) {
  const base = XP_RULES.contribution[c.kind] ?? 5;
  const mult = XP_RULES.statusMultiplier[c.status] ?? 1;
  return Math.round(base * mult);
}

const iso = (d) => new Date(d).toISOString().slice(0, 10);
const monthKey = (d) => new Date(d).toISOString().slice(0, 7);
function isoWeekKey(d) {
  const t = new Date(Date.UTC(new Date(d).getUTCFullYear(), new Date(d).getUTCMonth(), new Date(d).getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - y0) / DAY + 1) / 7)).padStart(2, '0')}`;
}
function prevWeekKey(key) {
  // step back 7 days from a date inside that ISO week
  const [y, w] = key.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const monday = new Date(jan4.getTime() - ((jan4.getUTCDay() || 7) - 1) * DAY + (w - 1) * 7 * DAY);
  return isoWeekKey(new Date(monday.getTime() - 7 * DAY));
}

/**
 * @param {object} input
 * @param {Array} input.skills        rows: {id,name,slug,category,status,proficiency,started_at,learned_at}
 * @param {Array} input.events        rows: {skill_name,event_type,from_level,to_level,occurred_at}
 * @param {Array} input.contributions rows: {id,kind,title,status,repo_owner,repo_name,skills,occurred_at,url}
 * @param {object} input.profile      {interests, coding_since, created_at}
 * @param {Date}   [input.now]
 */
export function computeGrowth({ skills = [], events = [], contributions = [], profile = {}, now = new Date() }) {
  const nowMs = new Date(now).getTime();
  const contribs = [...contributions].sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at));

  // ---------- XP ----------
  const skillXp = skills.reduce((sum, s) => sum + (s.status === 'learned' ? XP_RULES.skillLearned : 0) + s.proficiency * XP_RULES.perProficiencyPoint, 0);
  const contribXp = contribs.reduce((sum, c) => sum + contributionXp(c), 0);
  const level = levelFor(skillXp + contribXp);

  // ---------- totals ----------
  const byKind = {}; const byStatus = {};
  for (const c of contribs) { byKind[c.kind] = (byKind[c.kind] || 0) + 1; byStatus[c.status] = (byStatus[c.status] || 0) + 1; }
  const repos = new Map();
  for (const c of contribs) {
    if (!c.repo_owner || !c.repo_name) continue;
    const k = `${c.repo_owner}/${c.repo_name}`;
    const r = repos.get(k) || { repo: k, contributions: 0, merged: 0, firstAt: c.occurred_at, lastAt: c.occurred_at };
    r.contributions++; if (c.status === 'merged') r.merged++; r.lastAt = c.occurred_at;
    repos.set(k, r);
  }
  const prs = contribs.filter((c) => c.kind === 'pull_request');
  const mergedPrs = prs.filter((c) => c.status === 'merged');
  const totals = {
    skills: skills.length,
    skillsLearned: skills.filter((s) => s.status === 'learned').length,
    skillsLearning: skills.filter((s) => s.status === 'learning').length,
    languages: skills.filter((s) => s.category === 'language').length,
    contributions: contribs.length,
    byKind, byStatus,
    pullRequests: prs.length,
    mergedPullRequests: mergedPrs.length,
    mergeRate: prs.length ? Math.round((mergedPrs.length / prs.length) * 100) / 100 : null,
    repositories: repos.size,
  };

  // ---------- activity dates (contributions + skill events) ----------
  const activity = [
    ...contribs.map((c) => c.occurred_at),
    ...events.filter((e) => e.event_type !== 'removed').map((e) => e.occurred_at),
  ].map((d) => new Date(d).getTime()).filter((t) => t <= nowMs + DAY);

  // Heatmap: last 365 days of contributions (what GitHub-style calendars show)
  const heat = new Map();
  for (const c of contribs) {
    const t = new Date(c.occurred_at).getTime();
    if (nowMs - t <= 365 * DAY && t <= nowMs + DAY) heat.set(iso(t), (heat.get(iso(t)) || 0) + 1);
  }
  const heatmap = [...heat.entries()].sort().map(([date, count]) => ({ date, count }));

  // Streaks (weekly — kinder and more realistic for students than daily)
  const weeks = new Set(activity.map(isoWeekKey));
  let current = 0;
  let wk = isoWeekKey(nowMs);
  if (!weeks.has(wk)) wk = prevWeekKey(wk); // the current week isn't over yet
  while (weeks.has(wk)) { current++; wk = prevWeekKey(wk); }
  let longest = 0;
  for (const w of weeks) {
    if (weeks.has(prevWeekKey(w))) continue; // not a streak start
    let len = 0, k = w;
    const next = (key) => { const [y, n] = key.split('-W').map(Number); const jan4 = new Date(Date.UTC(y, 0, 4)); const monday = jan4.getTime() - ((jan4.getUTCDay() || 7) - 1) * DAY + (n - 1) * 7 * DAY; return isoWeekKey(monday + 7 * DAY); };
    while (weeks.has(k)) { len++; k = next(k); }
    longest = Math.max(longest, len);
  }
  const activeDays = new Set(activity.map((t) => iso(t))).size;

  // Momentum: last 30 days vs the 30 before (weighted by XP so a merged PR counts more than a commit)
  const windowXp = (from, to) => contribs.filter((c) => { const t = new Date(c.occurred_at).getTime(); return t > nowMs - from * DAY && t <= nowMs - to * DAY; }).reduce((s, c) => s + contributionXp(c), 0)
    + events.filter((e) => { const t = new Date(e.occurred_at).getTime(); return t > nowMs - from * DAY && t <= nowMs - to * DAY && ['learned', 'level_up', 'started'].includes(e.event_type); }).length * 10;
  const recent = windowXp(30, 0), previous = windowXp(60, 30);
  let trend = 'steady';
  if (recent === 0 && previous === 0) trend = 'inactive';
  else if (previous === 0) trend = 'accelerating';
  else if (recent / previous >= 1.25) trend = 'accelerating';
  else if (recent / previous <= 0.75) trend = 'slowing';
  const momentum = { trend, last30DaysXp: recent, previous30DaysXp: previous, explanation: 'XP earned in the last 30 days compared with the 30 days before (contributions weighted by type/status, +10 per skill milestone).' };

  // ---------- per-skill mastery (0–100, every point explained) ----------
  const mastery = skills.map((s) => {
    const used = contribs.filter((c) => (c.skills || []).includes(s.slug));
    const weightedUses = used.reduce((n, c) => n + (c.status === 'merged' ? 2 : 1), 0);
    const startMs = new Date(s.started_at).getTime();
    const months = Math.max(0, (nowMs - startMs) / (30 * DAY));
    const lastTouch = Math.max(
      ...used.map((c) => new Date(c.occurred_at).getTime()),
      ...events.filter((e) => e.skill_name === s.name).map((e) => new Date(e.occurred_at).getTime()),
      startMs,
    );
    const daysIdle = Math.max(0, (nowMs - lastTouch) / DAY);
    const parts = {
      selfRated: Math.round((s.proficiency / 5) * 40),
      evidence: Math.round(30 * (1 - Math.exp(-weightedUses / 4))),
      practiceTime: Math.round(Math.min(20, months * 2)),
      recency: Math.round(10 * Math.exp(-daysIdle / 90)),
    };
    const score = Math.min(100, parts.selfRated + parts.evidence + parts.practiceTime + parts.recency);
    return {
      skill: s.name, slug: s.slug, category: s.category, status: s.status, proficiency: s.proficiency,
      score, breakdown: parts, contributionsUsingSkill: used.length,
      startedAt: s.started_at, learnedAt: s.learned_at,
      daysToLearn: s.learned_at ? Math.round((new Date(s.learned_at) - startMs) / DAY) : null,
    };
  }).sort((a, b) => b.score - a.score);

  // ---------- monthly growth curve ----------
  const firstMs = Math.min(
    nowMs,
    ...skills.map((s) => new Date(s.started_at).getTime()),
    ...contribs.map((c) => new Date(c.occurred_at).getTime()),
  );
  const months = [];
  {
    const d = new Date(Date.UTC(new Date(firstMs).getUTCFullYear(), new Date(firstMs).getUTCMonth(), 1));
    const end = new Date(Date.UTC(new Date(nowMs).getUTCFullYear(), new Date(nowMs).getUTCMonth(), 1));
    let guard = 0;
    while (d <= end && guard++ < 240) { months.push(monthKey(d)); d.setUTCMonth(d.getUTCMonth() + 1); }
  }
  let cumXp = 0;
  const monthly = months.map((m) => {
    const monthEnd = new Date(`${m}-01T00:00:00Z`); monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
    const inMonth = contribs.filter((c) => monthKey(c.occurred_at) === m);
    const learnedInMonth = skills.filter((s) => s.learned_at && monthKey(s.learned_at) === m);
    const startedInMonth = skills.filter((s) => monthKey(s.started_at) === m);
    const gained = inMonth.reduce((n, c) => n + contributionXp(c), 0) + learnedInMonth.length * XP_RULES.skillLearned;
    cumXp += gained;
    const kinds = {}; for (const c of inMonth) kinds[c.kind] = (kinds[c.kind] || 0) + 1;
    return {
      month: m,
      contributions: inMonth.length,
      byKind: kinds,
      skillsStarted: startedInMonth.map((s) => s.name),
      skillsLearned: learnedInMonth.map((s) => s.name),
      skillsKnownCumulative: skills.filter((s) => new Date(s.started_at) < monthEnd).length,
      skillsLearnedCumulative: skills.filter((s) => s.learned_at && new Date(s.learned_at) < monthEnd).length,
      xpGained: gained,
      xpCumulative: cumXp,
    };
  });

  // ---------- language / stack evolution path ("Python → JavaScript → TypeScript → Node.js") ----------
  const path = [...skills]
    .filter((s) => ['language', 'framework', 'database'].includes(s.category))
    .sort((a, b) => new Date(a.started_at) - new Date(b.started_at) || a.name.localeCompare(b.name))
    .map((s, i, arr) => ({
      step: i + 1, skill: s.name, slug: s.slug, category: s.category, status: s.status, startedAt: s.started_at,
      gapDaysFromPrevious: i ? Math.round((new Date(s.started_at) - new Date(arr[i - 1].started_at)) / DAY) : null,
    }));
  const evolution = { path, summary: path.length ? path.map((p) => p.skill).join(' → ') : null };

  // ---------- milestone journey ----------
  const journey = [];
  const push = (date, type, title, detail = null) => date && journey.push({ date: new Date(date).toISOString(), type, title, detail });
  if (profile.coding_since) push(profile.coding_since, 'start', 'Started coding');
  if (profile.created_at) push(profile.created_at, 'joined', 'Joined the platform');
  const byStart = [...skills].sort((a, b) => new Date(a.started_at) - new Date(b.started_at));
  if (byStart[0]) push(byStart[0].started_at, 'first_skill', `First skill: ${byStart[0].name}`);
  for (const s of skills) if (s.learned_at) push(s.learned_at, 'skill_learned', `Learned ${s.name}`, `${Math.round((new Date(s.learned_at) - new Date(s.started_at)) / DAY)} days after starting`);
  const langs = byStart.filter((s) => s.category === 'language');
  if (langs[2]) push(langs[2].started_at, 'polyglot', 'Became a polyglot', `3rd language: ${langs[2].name}`);
  if (contribs[0]) push(contribs[0].occurred_at, 'first_contribution', 'First contribution', contribs[0].title);
  if (prs[0]) push(prs[0].occurred_at, 'first_pr', 'Opened first pull request', prs[0].title);
  if (mergedPrs[0]) push(mergedPrs[0].occurred_at, 'first_merge', 'First pull request merged!', mergedPrs[0].title);
  for (const n of [5, 10, 25, 50, 100, 250]) if (contribs[n - 1]) push(contribs[n - 1].occurred_at, 'contribution_count', `${n} contributions`);
  const seenRepos = new Set();
  for (const c of contribs) {
    if (!c.repo_owner) continue;
    const k = `${c.repo_owner}/${c.repo_name}`;
    if (seenRepos.has(k)) continue;
    seenRepos.add(k);
    if ([1, 3, 5, 10].includes(seenRepos.size)) push(c.occurred_at, 'repositories', seenRepos.size === 1 ? `First repository: ${k}` : `Contributed to ${seenRepos.size} repositories`, k);
  }
  // Level-ups: replay XP chronologically
  {
    const xpEvents = [
      ...contribs.map((c) => ({ t: new Date(c.occurred_at).getTime(), xp: contributionXp(c) })),
      ...skills.map((s) => ({ t: new Date(s.started_at).getTime(), xp: s.proficiency * XP_RULES.perProficiencyPoint })),
      ...skills.filter((s) => s.learned_at).map((s) => ({ t: new Date(s.learned_at).getTime(), xp: XP_RULES.skillLearned })),
    ].sort((a, b) => a.t - b.t);
    let run = 0, lv = 1;
    for (const e of xpEvents) {
      run += e.xp;
      const l = levelFor(run).level;
      if (l > lv) { lv = l; push(e.t, 'level_up', `Reached level ${l}: ${levelFor(run).title}`); }
    }
  }
  journey.sort((a, b) => a.date.localeCompare(b.date));

  // ---------- badges ----------
  const cats = new Set(skills.map((s) => s.category));
  const has = (slug) => skills.some((s) => s.slug === slug);
  const frontend = ['react', 'vue', 'nextjs', 'html-css', 'tailwind'].some(has);
  const backend = ['nodejs', 'express', 'django', 'flask', 'fastapi', 'spring', 'nestjs', 'rails', 'laravel'].some(has);
  const BADGES = [
    ['first-steps', 'First Steps', 'Added your first skill', skills.length >= 1],
    ['first-contribution', 'Hello, Open Source', 'Logged your first contribution', contribs.length >= 1],
    ['first-pr', 'Pull Request Pioneer', 'Opened a pull request', prs.length >= 1],
    ['merged', 'Merged!', 'Got a pull request merged', mergedPrs.length >= 1],
    ['polyglot', 'Polyglot', 'Working with 3+ languages', totals.languages >= 3],
    ['full-stack', 'Full-Stack Path', 'Frontend + backend + database skills', frontend && backend && cats.has('database')],
    ['doc-hero', 'Docs Hero', '3+ documentation contributions', (byKind.docs || 0) >= 3],
    ['reviewer', 'Second Pair of Eyes', 'Reviewed someone else’s code', (byKind.review || 0) >= 1],
    ['streak-4', 'On a Roll', '4-week activity streak', longest >= 4],
    ['multi-repo', 'Explorer', 'Contributed to 3+ repositories', repos.size >= 3],
    ['ten', 'Double Digits', '10+ contributions', contribs.length >= 10],
  ];
  const badges = BADGES.map(([id, name, description, earned]) => ({ id, name, description, earned: !!earned }));

  // ---------- categories (radar chart) ----------
  const categories = {};
  for (const s of skills) categories[s.category] = (categories[s.category] || 0) + 1;

  // ---------- next skills ----------
  const nextSkills = recommendNextSkills(skills, profile.interests || [], 5);

  // ---------- headline insights (plain-language, deterministic) ----------
  const insights = [];
  if (evolution.path.length >= 2) insights.push(`Your stack grew from ${evolution.path[0].skill} to ${evolution.path.length} technologies: ${evolution.summary}.`);
  const fastest = mastery.filter((m) => m.daysToLearn !== null).sort((a, b) => a.daysToLearn - b.daysToLearn)[0];
  if (fastest) insights.push(`Fastest skill you learned: ${fastest.skill} in ${fastest.daysToLearn} days.`);
  if (mastery[0]) insights.push(`Strongest skill right now: ${mastery[0].skill} (mastery ${mastery[0].score}/100).`);
  if (momentum.trend === 'accelerating') insights.push('Your momentum is accelerating compared with last month.');
  if (momentum.trend === 'slowing') insights.push('Activity slowed this month — one small contribution restarts your streak.');
  if (totals.pullRequests && totals.mergedPullRequests === 0) insights.push('You have open pull requests — following up on review comments is the fastest path to your first merge.');
  if (nextSkills[0]) insights.push(`Suggested next skill: ${nextSkills[0].name} (${nextSkills[0].reasons[0]}).`);

  return {
    generatedAt: new Date(nowMs).toISOString(),
    level,
    totals,
    streaks: { currentWeeks: current, longestWeeks: longest, activeDays },
    momentum,
    mastery,
    evolution,
    monthly,
    heatmap,
    journey,
    topRepositories: [...repos.values()].sort((a, b) => b.contributions - a.contributions).slice(0, 10),
    categories,
    badges,
    nextSkills,
    insights,
    rules: { xp: XP_RULES, levelFormula: 'XP needed for level n = 50 × (n−1) × n', mastery: 'selfRated(0–40) + evidence from tagged contributions(0–30) + practice time(0–20) + recency(0–10)' },
  };
}

export const skillCategory = (slug) => skillInfo(slug)?.category || 'other';

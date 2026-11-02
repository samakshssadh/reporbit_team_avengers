// Profile page: time spent on Reporbit, repos explored/contributed, topics, activity heatmap,
// growth, and "where you started vs where you are now".
import { query } from '../db/pool.js';
import { v, parse } from '../lib/validate.js';
import { requireAuth, requireCsrf } from '../lib/session.js';
import { rateLimiter } from '../lib/security.js';
import { computeGrowth } from '../services/growth.js';
import { resolveSkill } from '../services/skillGraph.js';
import { syncGithub, contributedRepos } from '../services/githubSync.js';

const auth = [requireAuth, requireCsrf];
const beatLimit = rateLimiter({ windowMs: 60e3, max: 6, key: (req) => `beat:${req.user.id}` });
const logLimit = rateLimiter({ windowMs: 60e3, max: 60, key: (req) => `log:${req.user.id}` });
const DAY = 86400e3;
const iso = (d) => new Date(d).toISOString().slice(0, 10);

export function dashboardRoutes(r) {
  // Heartbeat from the open tab: adds up to 5 minutes per call to today's total.
  r.post('/api/me/activity', ...auth, async (req, res) => {
    beatLimit(req);
    const b = parse(v.object({ seconds: v.int({ min: 1, max: 300 }) }), req.body);
    await query(
      `INSERT INTO user_activity (user_id, day, seconds) VALUES ($1, CURRENT_DATE, $2)
       ON CONFLICT (user_id, day) DO UPDATE SET seconds = LEAST(86400, user_activity.seconds + EXCLUDED.seconds)`,
      [req.user.id, b.seconds],
    );
    res.status(204).end();
  });

  r.post('/api/me/interactions', ...auth, async (req, res) => {
    logLimit(req);
    const b = parse(v.object({
      repoId: v.string({ min: 3, max: 200 }), repoName: v.string({ min: 1, max: 200 }),
      platform: v.enum(['github', 'gitlab', 'bitbucket'], { optional: true }),
      kind: v.enum(['viewed', 'roadmap', 'chat', 'contributed']),
    }), req.body);
    await query(
      `INSERT INTO repo_interactions (user_id, repo_id, repo_name, platform, kind) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, repo_id, kind) DO UPDATE SET count = repo_interactions.count + 1, last_at = now(), repo_name = EXCLUDED.repo_name`,
      [req.user.id, b.repoId, b.repoName, b.platform || 'github', b.kind],
    );
    res.status(204).end();
  });

  r.delete('/api/me/interactions', ...auth, async (req, res) => {
    const b = parse(v.object({ repoId: v.string({ min: 3, max: 200 }), kind: v.enum(['contributed']) }), req.body);
    await query('DELETE FROM repo_interactions WHERE user_id = $1 AND repo_id = $2 AND kind = $3', [req.user.id, b.repoId, b.kind]);
    res.status(204).end();
  });

  r.post('/api/me/topics', ...auth, async (req, res) => {
    logLimit(req);
    const b = parse(v.object({ topic: v.string({ min: 1, max: 60 }) }), req.body);
    const name = resolveSkill(b.topic).name;
    await query(
      `INSERT INTO learn_topics (user_id, topic) VALUES ($1,$2)
       ON CONFLICT (user_id, topic) DO UPDATE SET count = learn_topics.count + 1, last_at = now()`,
      [req.user.id, name],
    );
    res.status(204).end();
  });

  r.get('/api/me/dashboard', requireAuth, async (req, res) => {
    const uid = req.user.id;
    const [act, ints, topics, skills, events, contribs, prof, user, reviews] = await Promise.all([
      query("SELECT day::text AS day, seconds FROM user_activity WHERE user_id = $1 AND day > CURRENT_DATE - 372 ORDER BY day", [uid]),
      query('SELECT repo_id, repo_name, platform, kind, count, last_at FROM repo_interactions WHERE user_id = $1 ORDER BY last_at DESC', [uid]),
      query('SELECT topic, count, last_at FROM learn_topics WHERE user_id = $1 ORDER BY count DESC, last_at DESC LIMIT 30', [uid]),
      query('SELECT * FROM skills WHERE user_id = $1 ORDER BY started_at, name', [uid]),
      query('SELECT skill_name, event_type, from_level, to_level, occurred_at FROM skill_events WHERE user_id = $1 ORDER BY occurred_at', [uid]),
      query('SELECT * FROM contributions WHERE user_id = $1 ORDER BY occurred_at', [uid]),
      query('SELECT * FROM profiles WHERE user_id = $1', [uid]),
      query('SELECT created_at FROM users WHERE id = $1', [uid]),
      query("SELECT count(*)::int AS n, count(*) FILTER (WHERE verdict = 'approve')::int AS approved FROM pr_reviews WHERE user_id = $1", [uid]),
    ]);
    const p = prof.rows[0] || {};
    // Keep GitHub data fresh: re-sync in the background if older than 6 hours.
    const { rows: [gh] } = await query('SELECT github_login, github_verified, github_synced_at FROM users WHERE id = $1', [uid]);
    if (gh.github_login && (!gh.github_synced_at || Date.now() - new Date(gh.github_synced_at) > 6 * 3600e3)) syncGithub(uid, gh.github_login).catch(() => {});
    const ghRepos = await contributedRepos(uid);
    const createdAt = user.rows[0]?.created_at;

    // ---- time on site
    const daily = act.rows.map((x) => ({ date: x.day, seconds: x.seconds }));
    const today = iso(Date.now());
    const totalSeconds = daily.reduce((n, d) => n + d.seconds, 0);
    const last7 = daily.filter((d) => Date.now() - new Date(d.date) <= 7 * DAY).reduce((n, d) => n + d.seconds, 0);
    const todaySeconds = daily.find((d) => d.date === today)?.seconds || 0;

    // ---- repos
    const repoMap = new Map();
    for (const x of ints.rows) {
      const e = repoMap.get(x.repo_id) || { repoId: x.repo_id, repoName: x.repo_name, platform: x.platform, kinds: {}, lastAt: x.last_at };
      e.kinds[x.kind] = x.count;
      if (new Date(x.last_at) > new Date(e.lastAt)) e.lastAt = x.last_at;
      repoMap.set(x.repo_id, e);
    }
    // "Contributed" comes from real GitHub activity, not self-reporting.
    for (const g of ghRepos) {
      const key = g.fullName.replace('/', '__');
      const e = repoMap.get(key) || { repoId: key, repoName: g.fullName, platform: 'github', kinds: {}, lastAt: g.lastAt };
      e.kinds.contributed = g.prs + g.issues; e.prs = g.prs; e.merged = g.merged; e.issues = g.issues;
      if (new Date(g.lastAt) > new Date(e.lastAt)) e.lastAt = g.lastAt;
      repoMap.set(key, e);
    }
    for (const e of repoMap.values()) if (!ghRepos.some((g) => g.fullName.replace('/', '__') === e.repoId)) delete e.kinds.contributed; // ignore old manual marks
    const repoList = [...repoMap.values()].sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
    const repos = {
      explored: repoList.length,
      roadmaps: repoList.filter((x) => x.kinds.roadmap).length,
      askedAI: repoList.filter((x) => x.kinds.chat).length,
      contributed: ghRepos.length,
      github: { connected: !!gh.github_login, login: gh.github_login, verified: gh.github_verified, syncedAt: gh.github_synced_at },
      list: repoList.slice(0, 20),
    };

    // ---- topics
    const learning = skills.rows.filter((s) => s.status === 'learning').map((s) => s.name);
    const learned = skills.rows.filter((s) => s.status === 'learned').map((s) => s.name);
    const explored = topics.rows.map((t) => ({ topic: t.topic, count: t.count, lastAt: t.last_at }));
    const allTopics = new Set([...skills.rows.map((s) => s.name), ...explored.map((t) => t.topic)]);

    // ---- heatmap (last 371 days, Sunday-aligned): minutes on site + contributions + skill milestones
    const cells = new Map();
    const add = (date, field, n) => { const c = cells.get(date) || { date, minutes: 0, contributions: 0, milestones: 0 }; c[field] += n; cells.set(date, c); };
    for (const d of daily) add(d.date, 'minutes', Math.round(d.seconds / 60));
    for (const c of contribs.rows) add(iso(c.occurred_at), 'contributions', 1);
    for (const e of events.rows) if (e.event_type !== 'removed') add(iso(e.occurred_at), 'milestones', 1);
    const end = new Date(); end.setUTCHours(0, 0, 0, 0);
    const start = new Date(end.getTime() - 370 * DAY); start.setUTCDate(start.getUTCDate() - start.getUTCDay());
    const heatmap = [];
    for (let t = start.getTime(); t <= end.getTime(); t += DAY) {
      const date = iso(t);
      const c = cells.get(date) || { date, minutes: 0, contributions: 0, milestones: 0 };
      const score = c.minutes / 10 + c.contributions * 2 + c.milestones;
      heatmap.push({ ...c, level: score === 0 ? 0 : score < 2 ? 1 : score < 5 ? 2 : score < 10 ? 3 : 4 });
    }
    const activeDays = heatmap.filter((h) => h.level > 0).length;

    // ---- growth (existing engine)
    const growth = computeGrowth({ skills: skills.rows, events: events.rows, contributions: contribs.rows, profile: { interests: p.interests || [], coding_since: p.coding_since, created_at: createdAt, prior_contributions: p.prior_contributions || 0 } });

    // ---- then vs now
    const snap = p.onboarding_snapshot || null;
    const thenSkills = snap?.skills?.length ? snap.skills : skills.rows.filter((s) => new Date(s.created_at) - new Date(createdAt) < DAY).map((s) => s.name);
    const nowSkills = skills.rows.map((s) => s.name);
    const daysSince = createdAt ? Math.max(0, Math.round((Date.now() - new Date(createdAt)) / DAY)) : 0;
    const thenMonths = snap?.experienceMonths ?? p.experience_months ?? null;
    const thenVsNow = {
      since: snap?.at || createdAt,
      daysSince,
      then: { skills: thenSkills, skillCount: thenSkills.length, contributions: p.prior_contributions ?? snap?.priorContributions ?? 0, experienceMonths: thenMonths, level: 1, reposExplored: 0 },
      now: { skills: nowSkills, skillCount: nowSkills.length, contributions: contribs.rows.length, experienceMonths: thenMonths == null ? null : thenMonths + Math.floor(daysSince / 30), level: growth.level.level, levelTitle: growth.level.title, reposExplored: repos.explored },
      newSkills: nowSkills.filter((s) => !thenSkills.includes(s)),
    };

    res.json({
      timeSpent: { totalSeconds, todaySeconds, last7DaysSeconds: last7, daysTracked: daily.length, daily },
      repos, topics: { learning, learned, explored, total: allTopics.size },
      dummyPRs: { reviewed: reviews.rows[0]?.n || 0, approved: reviews.rows[0]?.approved || 0 },
      heatmap, activeDays, growth, thenVsNow,
      profile: { profession: p.profession, experienceMonths: p.experience_months, priorContributions: p.prior_contributions || 0, joinedAt: createdAt },
    });
  });
}

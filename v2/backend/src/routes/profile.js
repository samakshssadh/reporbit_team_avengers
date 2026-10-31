// Profile, skills (with growth event log), contributions, growth dashboard, public profile.
import { query, tx } from '../db/pool.js';
import { errors } from '../lib/errors.js';
import { v, parse } from '../lib/validate.js';
import { requireAuth, requireCsrf, publicUser } from '../lib/session.js';
import { rateLimiter } from '../lib/security.js';
import { resolveSkill, skillForGithubLanguage, skillInfo } from '../services/skillGraph.js';
import { computeGrowth } from '../services/growth.js';
import { getUserContributions, getRepoMeta, getGithubUser, OWNER_RE } from '../services/github.js';
import { growthStory, extractSkills } from '../services/mentor.js';

const auth = [requireAuth, requireCsrf];
const gemmaLimit = rateLimiter({ windowMs: 60e3, max: 10, key: (req) => `gemma:${req.user.id}` });
const syncLimit = rateLimiter({ windowMs: 10 * 60e3, max: 5, key: (req) => `sync:${req.user.id}` });

const EXPERIENCE = ['beginner', 'intermediate', 'advanced'];
const CATEGORIES = ['language', 'framework', 'library', 'tool', 'database', 'cloud', 'concept', 'other'];
const SKILL_STATUS = ['learning', 'learned', 'paused'];
const KINDS = ['pull_request', 'issue', 'commit', 'review', 'docs', 'discussion', 'other'];
const C_STATUS = ['open', 'merged', 'closed', 'draft', 'completed'];

// ---------- mappers ----------
const mapSkill = (s) => ({
  id: s.id, name: s.name, slug: s.slug, category: s.category, status: s.status, proficiency: s.proficiency,
  startedAt: s.started_at, learnedAt: s.learned_at, notes: s.notes, updatedAt: s.updated_at,
});
const mapContribution = (c) => ({
  id: c.id, kind: c.kind, title: c.title, description: c.description,
  repo: c.repo_owner ? { owner: c.repo_owner, name: c.repo_name, fullName: `${c.repo_owner}/${c.repo_name}` } : null,
  url: c.url, status: c.status, skills: c.skills.map((s) => skillInfo(s)?.name || s), skillSlugs: c.skills,
  occurredAt: new Date(c.occurred_at).toISOString(), source: c.source, createdAt: c.created_at,
});
function mapProfile(p, skills) {
  if (!p) return null;
  return {
    skills: skills.filter((s) => s.status !== 'paused').map((s) => s.name), // contract v1 field
    interests: p.interests, experience: p.experience,
    headline: p.headline, bio: p.bio, location: p.location, goals: p.goals, links: p.links,
    codingSince: p.coding_since, isPublic: p.is_public, onboarded: p.onboarded, updatedAt: p.updated_at,
    profession: p.profession ?? null, experienceMonths: p.experience_months ?? null, priorContributions: p.prior_contributions ?? 0,
  };
}

async function loadAll(userId) {
  const [p, s, e, c, u] = await Promise.all([
    query('SELECT * FROM profiles WHERE user_id = $1', [userId]),
    query('SELECT * FROM skills WHERE user_id = $1 ORDER BY started_at, name', [userId]),
    query('SELECT skill_name, event_type, from_level, to_level, note, occurred_at FROM skill_events WHERE user_id = $1 ORDER BY occurred_at', [userId]),
    query('SELECT * FROM contributions WHERE user_id = $1 ORDER BY occurred_at', [userId]),
    query('SELECT created_at FROM users WHERE id = $1', [userId]),
  ]);
  return { profile: p.rows[0] || null, skills: s.rows, events: e.rows, contributions: c.rows, userCreatedAt: u.rows[0]?.created_at };
}

function growthFor(all) {
  return computeGrowth({
    skills: all.skills, events: all.events, contributions: all.contributions,
    profile: { interests: all.profile?.interests || [], coding_since: all.profile?.coding_since, created_at: all.userCreatedAt, prior_contributions: all.profile?.prior_contributions || 0 },
  });
}

async function logEvent(c, userId, skill, type, from = null, to = null, note = null, at = null) {
  await c.query(
    'INSERT INTO skill_events (user_id, skill_id, skill_name, event_type, from_level, to_level, note, occurred_at) VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8, now()))',
    [userId, skill.id, skill.name, type, from, to, note, at],
  );
}

async function insertSkill(c, userId, input) {
  const r = resolveSkill(input.name);
  const status = input.status || 'learning';
  const startedAt = input.startedAt ? input.startedAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
  let learnedAt = input.learnedAt ? input.learnedAt.slice(0, 10) : null;
  if (status === 'learned' && !learnedAt) learnedAt = new Date().toISOString().slice(0, 10);
  if (learnedAt && learnedAt < startedAt) throw errors.validation('learnedAt cannot be before startedAt', [{ field: 'learnedAt', message: 'before startedAt' }]);
  const exists = await c.query('SELECT 1 FROM skills WHERE user_id = $1 AND slug = $2', [userId, r.slug]);
  if (exists.rows.length) throw errors.conflict(`You already have ${r.name} in your skills`);
  const { rows } = await c.query(
    `INSERT INTO skills (user_id, name, slug, category, status, proficiency, started_at, learned_at, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [userId, r.known ? r.name : input.name.trim(), r.slug, input.category || r.category, status, input.proficiency || 1, startedAt, learnedAt, input.notes || null],
  );
  const s = rows[0];
  await logEvent(c, userId, s, 'started', null, s.proficiency, null, `${startedAt}T12:00:00Z`);
  if (learnedAt) await logEvent(c, userId, s, 'learned', null, s.proficiency, null, `${learnedAt}T12:00:00Z`);
  return s;
}

const skillCreate = v.object({
  name: v.string({ min: 1, max: 60 }),
  category: v.enum(CATEGORIES, { optional: true }),
  status: v.enum(SKILL_STATUS, { optional: true }),
  proficiency: v.int({ min: 1, max: 5, optional: true }),
  startedAt: v.date({ optional: true }),
  learnedAt: v.date({ optional: true, nullable: true }),
  notes: v.string({ max: 500, optional: true, nullable: true }),
});
const skillPatch = v.object({
  category: v.enum(CATEGORIES, { optional: true }),
  status: v.enum(SKILL_STATUS, { optional: true }),
  proficiency: v.int({ min: 1, max: 5, optional: true }),
  startedAt: v.date({ optional: true }),
  learnedAt: v.date({ optional: true, nullable: true }),
  notes: v.string({ max: 500, optional: true, nullable: true }),
  note: v.string({ max: 300, optional: true }), // optional note for the growth log ("finished the TS handbook")
}, { partial: true });

const profileSchema = v.object({
  skills: v.array(v.string({ min: 1, max: 60 }), { max: 60, optional: true, unique: true }),
  interests: v.array(v.string({ min: 1, max: 60 }), { max: 20, optional: true, unique: true }),
  experience: v.enum(EXPERIENCE, { optional: true }),
  headline: v.string({ max: 120, optional: true, nullable: true }),
  bio: v.string({ max: 2000, optional: true, nullable: true }),
  location: v.string({ max: 100, optional: true, nullable: true }),
  goals: v.array(v.string({ min: 1, max: 200 }), { max: 10, optional: true }),
  links: v.object({ github: v.url({ optional: true, nullable: true }), linkedin: v.url({ optional: true, nullable: true }), website: v.url({ optional: true, nullable: true }), twitter: v.url({ optional: true, nullable: true }) }, { optional: true, partial: true }),
  codingSince: v.date({ optional: true, nullable: true }),
  isPublic: v.bool({ optional: true }),
  displayName: v.string({ min: 1, max: 80, optional: true }),
  githubLogin: v.string({ min: 1, max: 39, pattern: OWNER_RE, optional: true, nullable: true }),
  onboarded: v.bool({ optional: true }),
  profession: v.string({ max: 80, optional: true, nullable: true }),
  experienceMonths: v.int({ min: 0, max: 720, optional: true, nullable: true }),
  priorContributions: v.int({ min: 0, max: 100000, optional: true }),
}, { partial: true });

// Experience level derived from time coding (used by recommendations) unless the user sets it explicitly.
export const levelFromMonths = (m) => (m < 12 ? 'beginner' : m < 36 ? 'intermediate' : 'advanced');

const contributionCreate = v.object({
  kind: v.enum(KINDS),
  title: v.string({ min: 1, max: 300 }),
  description: v.string({ max: 4000, optional: true, nullable: true }),
  repo: v.string({ max: 140, optional: true, nullable: true, pattern: /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/ }),
  url: v.url({ optional: true, nullable: true }),
  status: v.enum(C_STATUS, { optional: true }),
  skills: v.array(v.string({ min: 1, max: 60 }), { max: 20, optional: true, unique: true }),
  occurredAt: v.date({ optional: true }),
});
const contributionPatch = v.object({
  kind: v.enum(KINDS, { optional: true }),
  title: v.string({ min: 1, max: 300, optional: true }),
  description: v.string({ max: 4000, optional: true, nullable: true }),
  repo: v.string({ max: 140, optional: true, nullable: true, pattern: /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/ }),
  url: v.url({ optional: true, nullable: true }),
  status: v.enum(C_STATUS, { optional: true }),
  skills: v.array(v.string({ min: 1, max: 60 }), { max: 20, optional: true, unique: true }),
  occurredAt: v.date({ optional: true }),
}, { partial: true });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const idParam = (req) => { if (!UUID.test(req.params.id)) throw errors.notFound(); return req.params.id; };

const encodeCursor = (row) => Buffer.from(JSON.stringify([new Date(row.occurred_at).toISOString(), row.id])).toString('base64url');
function decodeCursor(c) {
  try { const [t, id] = JSON.parse(Buffer.from(c, 'base64url').toString()); if (Number.isNaN(Date.parse(t)) || !UUID.test(id)) throw 0; return [t, id]; }
  catch { throw errors.validation('Invalid cursor', [{ field: 'cursor', message: 'invalid' }]); }
}

export function profileRoutes(r) {
  // ===== me =====
  r.get('/api/me', requireAuth, async (req, res) => {
    const all = await loadAll(req.user.id);
    const have = new Set(all.skills.map((s) => s.slug));
    const inferred = new Map();
    for (const c of all.contributions) for (const s of c.skills) if (!have.has(s)) inferred.set(s, (inferred.get(s) || 0) + 1);
    const suggestedSkills = [...inferred.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => skillInfo(s)?.name || s).slice(0, 10);
    res.json({ user: publicUser(req.user), profile: mapProfile(all.profile, all.skills), suggestedSkills });
  });

  r.put('/api/me/profile', ...auth, async (req, res) => {
    const b = parse(profileSchema, req.body);
    await tx(async (c) => {
      const sets = []; const vals = [];
      const col = (name, val) => { vals.push(val); sets.push(`${name} = $${vals.length}`); };
      if (b.interests !== undefined) col('interests', b.interests);
      if (b.experience !== undefined) col('experience', b.experience);
      else if (b.experienceMonths !== undefined && b.experienceMonths !== null) col('experience', levelFromMonths(b.experienceMonths));
      if (b.profession !== undefined) col('profession', b.profession);
      if (b.experienceMonths !== undefined) col('experience_months', b.experienceMonths);
      if (b.priorContributions !== undefined) col('prior_contributions', b.priorContributions);
      if (b.headline !== undefined) col('headline', b.headline);
      if (b.bio !== undefined) col('bio', b.bio);
      if (b.location !== undefined) col('location', b.location);
      if (b.goals !== undefined) col('goals', b.goals);
      if (b.links !== undefined) col('links', JSON.stringify(b.links));
      if (b.codingSince !== undefined) col('coding_since', b.codingSince ? b.codingSince.slice(0, 10) : null);
      if (b.isPublic !== undefined) col('is_public', b.isPublic);
      if (b.onboarded !== undefined) col('onboarded', b.onboarded);
      if (sets.length) { vals.push(req.user.id); await c.query(`UPDATE profiles SET ${sets.join(', ')}, updated_at = now() WHERE user_id = $${vals.length}`, vals); }
      if (b.displayName !== undefined || b.githubLogin !== undefined) {
        if (b.githubLogin) {
          const taken = await c.query('SELECT 1 FROM users WHERE lower(github_login) = lower($1) AND id <> $2', [b.githubLogin, req.user.id]);
          if (taken.rows.length) throw errors.conflict('That GitHub username is linked to another account');
        }
        await c.query('UPDATE users SET display_name = COALESCE($1, display_name), github_login = CASE WHEN $2::boolean THEN $3 ELSE github_login END, updated_at = now() WHERE id = $4',
          [b.displayName ?? null, b.githubLogin !== undefined, b.githubLogin ?? null, req.user.id]);
      }
      // Contract v1: `skills` is the confirmed list. Add new ones, remove ones the user unticked.
      if (b.skills !== undefined) {
        const current = (await c.query('SELECT * FROM skills WHERE user_id = $1', [req.user.id])).rows;
        const wanted = new Map(b.skills.map((n) => [resolveSkill(n).slug, n]));
        for (const s of current) if (!wanted.has(s.slug)) { await logEvent(c, req.user.id, s, 'removed'); await c.query('DELETE FROM skills WHERE id = $1', [s.id]); }
        const have = new Set(current.map((s) => s.slug));
        for (const [slug, name] of wanted) if (!have.has(slug)) await insertSkill(c, req.user.id, { name, proficiency: 2 });
      }
    });
    const all = await loadAll(req.user.id);
    res.json({ profile: mapProfile(all.profile, all.skills) });
  });

  r.delete('/api/me', ...auth, async (req, res) => {
    await query('DELETE FROM users WHERE id = $1', [req.user.id]); // cascades to everything
    res.cookie('sid', '', { httpOnly: true, maxAge: 0 });
    res.status(204).end();
  });

  // ===== skills =====
  r.get('/api/me/skills', requireAuth, async (req, res) => {
    const { rows } = await query('SELECT * FROM skills WHERE user_id = $1 ORDER BY started_at, name', [req.user.id]);
    res.json({ items: rows.map(mapSkill) });
  });

  r.post('/api/me/skills', ...auth, async (req, res) => {
    const b = parse(skillCreate, req.body);
    const s = await tx((c) => insertSkill(c, req.user.id, b));
    res.status(201).json({ skill: mapSkill(s) });
  });

  // Bulk add (onboarding: "I know Python, JS, TS..." or confirmed Gemma suggestions)
  r.post('/api/me/skills/bulk', ...auth, async (req, res) => {
    const b = parse(v.object({ skills: v.array(skillCreate, { max: 40 }) }), req.body);
    const out = await tx(async (c) => {
      const created = []; const skipped = [];
      const have = new Set((await c.query('SELECT slug FROM skills WHERE user_id = $1', [req.user.id])).rows.map((x) => x.slug));
      for (const s of b.skills) {
        const slug = resolveSkill(s.name).slug;
        if (have.has(slug)) { skipped.push(s.name); continue; }
        have.add(slug);
        created.push(mapSkill(await insertSkill(c, req.user.id, s)));
      }
      return { created, skipped };
    });
    res.status(201).json(out);
  });

  r.patch('/api/me/skills/:id', ...auth, async (req, res) => {
    const id = idParam(req);
    const b = parse(skillPatch, req.body);
    const s = await tx(async (c) => {
      const { rows } = await c.query('SELECT * FROM skills WHERE id = $1 AND user_id = $2 FOR UPDATE', [id, req.user.id]);
      if (!rows.length) throw errors.notFound('Skill not found');
      const old = rows[0];
      const next = {
        category: b.category ?? old.category,
        status: b.status ?? old.status,
        proficiency: b.proficiency ?? old.proficiency,
        started_at: b.startedAt ? b.startedAt.slice(0, 10) : old.started_at,
        learned_at: b.learnedAt !== undefined ? (b.learnedAt ? b.learnedAt.slice(0, 10) : null) : old.learned_at,
        notes: b.notes !== undefined ? b.notes : old.notes,
      };
      if (next.status === 'learned' && !next.learned_at) next.learned_at = new Date().toISOString().slice(0, 10);
      if (next.status === 'learning' && b.status === 'learning' && old.status === 'learned') next.learned_at = null;
      if (next.learned_at && next.learned_at < next.started_at) throw errors.validation('learnedAt cannot be before startedAt', [{ field: 'learnedAt', message: 'before startedAt' }]);
      const { rows: up } = await c.query(
        `UPDATE skills SET category=$1, status=$2, proficiency=$3, started_at=$4, learned_at=$5, notes=$6, updated_at=now() WHERE id=$7 RETURNING *`,
        [next.category, next.status, next.proficiency, next.started_at, next.learned_at, next.notes, id],
      );
      const s2 = up[0];
      if (next.proficiency > old.proficiency) await logEvent(c, req.user.id, s2, 'level_up', old.proficiency, next.proficiency, b.note);
      if (next.proficiency < old.proficiency) await logEvent(c, req.user.id, s2, 'level_down', old.proficiency, next.proficiency, b.note);
      if (next.status !== old.status) {
        const type = next.status === 'learned' ? 'learned' : next.status === 'paused' ? 'paused' : 'resumed';
        await logEvent(c, req.user.id, s2, type, old.proficiency, next.proficiency, b.note);
      }
      return s2;
    });
    res.json({ skill: mapSkill(s) });
  });

  r.delete('/api/me/skills/:id', ...auth, async (req, res) => {
    const id = idParam(req);
    await tx(async (c) => {
      const { rows } = await c.query('SELECT * FROM skills WHERE id = $1 AND user_id = $2', [id, req.user.id]);
      if (!rows.length) throw errors.notFound('Skill not found');
      await logEvent(c, req.user.id, rows[0], 'removed');
      await c.query('DELETE FROM skills WHERE id = $1', [id]);
    });
    res.status(204).end();
  });

  r.get('/api/me/skills/:id/history', requireAuth, async (req, res) => {
    const id = idParam(req);
    const own = await query('SELECT 1 FROM skills WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (!own.rows.length) throw errors.notFound('Skill not found');
    const { rows } = await query('SELECT event_type, from_level, to_level, note, occurred_at FROM skill_events WHERE skill_id = $1 AND user_id = $2 ORDER BY occurred_at', [id, req.user.id]);
    res.json({ items: rows.map((e) => ({ type: e.event_type, fromLevel: e.from_level, toLevel: e.to_level, note: e.note, occurredAt: e.occurred_at })) });
  });

  // Gemma: read "about me" / resume text and SUGGEST skills (user confirms via /skills/bulk)
  r.post('/api/me/skills/extract', ...auth, async (req, res) => {
    gemmaLimit(req);
    const b = parse(v.object({ text: v.string({ min: 10, max: 6000 }) }), req.body);
    const out = await extractSkills(b.text);
    const have = new Set((await query('SELECT slug FROM skills WHERE user_id = $1', [req.user.id])).rows.map((x) => x.slug));
    res.json({ suggestions: out.suggestions.map((s) => ({ ...s, alreadyAdded: have.has(s.slug) })), model: out.model, note: 'Suggestions only — confirm them with POST /api/me/skills/bulk' });
  });

  // ===== contributions =====
  r.get('/api/me/contributions', requireAuth, async (req, res) => {
    const q = parse(v.object({
      kind: v.enum(KINDS, { optional: true }), status: v.enum(C_STATUS, { optional: true }),
      skill: v.string({ max: 60, optional: true }), cursor: v.string({ max: 200, optional: true }), limit: v.int({ min: 1, max: 100, optional: true }),
    }), req.query, 'query');
    const limit = q.limit || 20;
    const where = ['user_id = $1']; const vals = [req.user.id];
    if (q.kind) { vals.push(q.kind); where.push(`kind = $${vals.length}`); }
    if (q.status) { vals.push(q.status); where.push(`status = $${vals.length}`); }
    if (q.skill) { vals.push(resolveSkill(q.skill).slug); where.push(`$${vals.length} = ANY(skills)`); }
    if (q.cursor) { const [t, id] = decodeCursor(q.cursor); vals.push(t, id); where.push(`(occurred_at, id) < ($${vals.length - 1}::timestamptz, $${vals.length}::uuid)`); }
    vals.push(limit + 1);
    const { rows } = await query(`SELECT * FROM contributions WHERE ${where.join(' AND ')} ORDER BY occurred_at DESC, id DESC LIMIT $${vals.length}`, vals);
    const page = rows.slice(0, limit);
    const { rows: [{ count }] } = await query('SELECT count(*) FROM contributions WHERE user_id = $1', [req.user.id]);
    res.json({ items: page.map(mapContribution), nextCursor: rows.length > limit ? encodeCursor(page[page.length - 1]) : null, total: count });
  });

  r.post('/api/me/contributions', ...auth, async (req, res) => {
    const b = parse(contributionCreate, req.body);
    const [owner, name] = b.repo ? b.repo.split('/') : [null, null];
    const { rows } = await query(
      `INSERT INTO contributions (user_id, kind, title, description, repo_owner, repo_name, url, status, skills, occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10::timestamptz, now())) RETURNING *`,
      [req.user.id, b.kind, b.title, b.description || null, owner, name, b.url || null, b.status || (b.kind === 'pull_request' ? 'open' : 'completed'), (b.skills || []).map((s) => resolveSkill(s).slug), b.occurredAt || null],
    );
    res.status(201).json({ contribution: mapContribution(rows[0]) });
  });

  r.patch('/api/me/contributions/:id', ...auth, async (req, res) => {
    const id = idParam(req);
    const b = parse(contributionPatch, req.body);
    const sets = []; const vals = [];
    const col = (n, val) => { vals.push(val); sets.push(`${n} = $${vals.length}`); };
    if (b.kind) col('kind', b.kind);
    if (b.title) col('title', b.title);
    if (b.description !== undefined) col('description', b.description);
    if (b.repo !== undefined) { const [o, n] = b.repo ? b.repo.split('/') : [null, null]; col('repo_owner', o); col('repo_name', n); }
    if (b.url !== undefined) col('url', b.url);
    if (b.status) col('status', b.status);
    if (b.skills) col('skills', b.skills.map((s) => resolveSkill(s).slug));
    if (b.occurredAt) col('occurred_at', b.occurredAt);
    if (!sets.length) throw errors.validation('Nothing to update');
    vals.push(id, req.user.id);
    const { rows } = await query(`UPDATE contributions SET ${sets.join(', ')}, updated_at = now() WHERE id = $${vals.length - 1} AND user_id = $${vals.length} RETURNING *`, vals);
    if (!rows.length) throw errors.notFound('Contribution not found');
    res.json({ contribution: mapContribution(rows[0]) });
  });

  r.delete('/api/me/contributions/:id', ...auth, async (req, res) => {
    const id = idParam(req);
    const { rowCount } = await query('DELETE FROM contributions WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (!rowCount) throw errors.notFound('Contribution not found');
    res.status(204).end();
  });

  // Import real public PRs/issues from GitHub for the linked username. Idempotent (dedupe by GitHub node id).
  r.post('/api/me/contributions/sync-github', ...auth, async (req, res) => {
    syncLimit(req);
    const login = req.user.githubLogin;
    if (!login) throw errors.validation('Link your GitHub username first (PUT /api/me/profile {"githubLogin": "..."})', [{ field: 'githubLogin', message: 'not set' }]);
    const items = await getUserContributions(login);
    // Tag each contribution with the repo's main languages (max 15 repo lookups, cached 1h).
    const repoKeys = [...new Set(items.filter((i) => i.owner).map((i) => `${i.owner}/${i.repo}`))].slice(0, 15);
    const repoSkills = new Map();
    await Promise.all(repoKeys.map(async (k) => {
      const [o, n] = k.split('/');
      try { const m = await getRepoMeta(o, n); repoSkills.set(k, (m.data.languages || []).slice(0, 3).map(skillForGithubLanguage).filter(Boolean)); } catch { repoSkills.set(k, []); }
    }));
    let inserted = 0, updated = 0;
    await tx(async (c) => {
      for (const it of items) {
        const { rows } = await c.query(
          `INSERT INTO contributions (user_id, kind, title, repo_owner, repo_name, url, status, skills, occurred_at, source, external_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'github',$10)
           ON CONFLICT (user_id, source, external_id) WHERE external_id IS NOT NULL
           DO UPDATE SET status = EXCLUDED.status, title = EXCLUDED.title, updated_at = now()
           RETURNING (xmax = 0) AS inserted`,
          [req.user.id, it.kind, it.title, it.owner, it.repo, it.url, it.status, repoSkills.get(`${it.owner}/${it.repo}`) || [], it.occurredAt, it.externalId],
        );
        if (rows[0].inserted) inserted++; else updated++;
      }
    });
    // Pull avatar once, if missing.
    if (!req.user.avatarUrl) { try { const u = await getGithubUser(login); await query('UPDATE users SET avatar_url = $1 WHERE id = $2', [u.avatar_url, req.user.id]); } catch { /* optional */ } }
    res.json({ githubLogin: login, fetched: items.length, inserted, updated, note: 'Public pull requests and issues only (max 100 each). Commits and reviews can be logged manually.' });
  });

  // ===== growth =====
  r.get('/api/me/growth', requireAuth, async (req, res) => {
    res.json(growthFor(await loadAll(req.user.id)));
  });

  r.post('/api/me/growth/story', ...auth, async (req, res) => {
    gemmaLimit(req);
    const growth = growthFor(await loadAll(req.user.id));
    if (!growth.totals.skills && !growth.totals.contributions) throw errors.validation('Add some skills or contributions first — Gemma only narrates real data');
    res.json(await growthStory(growth, req.user.displayName));
  });

  // ===== public profile (opt-in via isPublic) =====
  r.get('/api/u/:handle', async (req, res) => {
    const h = String(req.params.handle).toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,38}$/.test(h)) throw errors.notFound();
    const { rows } = await query('SELECT u.id, u.display_name, u.handle, u.github_login, u.avatar_url, u.created_at FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.handle = $1 AND p.is_public', [h]);
    if (!rows.length) throw errors.notFound('Profile not found or private');
    const all = await loadAll(rows[0].id);
    const g = growthFor(all);
    const p = mapProfile(all.profile, all.skills);
    res.json({
      user: { displayName: rows[0].display_name, handle: rows[0].handle, githubLogin: rows[0].github_login, avatarUrl: rows[0].avatar_url, joinedAt: rows[0].created_at },
      profile: { headline: p.headline, bio: p.bio, location: p.location, skills: p.skills, interests: p.interests, experience: p.experience, links: p.links, codingSince: p.codingSince },
      growth: { level: g.level, totals: g.totals, streaks: g.streaks, evolution: g.evolution, mastery: g.mastery, monthly: g.monthly, heatmap: g.heatmap, journey: g.journey, badges: g.badges.filter((b) => b.earned), topRepositories: g.topRepositories },
    });
  });
}

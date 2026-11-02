// Endpoints in the exact shape the Orbit frontend calls (src/services/api.ts):
//   GET  /api/repositories?skills=&experience=     -> Repository[]
//   GET  /api/repositories/:id/roadmap             -> ContributionRoadmap   (id = "owner__repo")
//   POST /api/chat {messages, repoContext}         -> {response, model, sources, caveats}
// Work without login (the frontend has none yet); signed-in users get their saved skills merged in.
import { query } from '../db/pool.js';
import { errors, AppError } from '../lib/errors.js';
import { v, parse } from '../lib/validate.js';
import { rateLimiter, clientIp } from '../lib/security.js';
import { requireCsrf } from '../lib/session.js';
import { recommendRepositories, buildRoadmap, fromRepoId, searchRepos, repoDetails } from '../services/orbit.js';
import { platformDocs } from '../services/platforms.js';
import { getRepoDocs } from '../services/github.js';
import { mentorChat, buildMentorContext, LIMITS } from '../services/mentor.js';
import { gemmaInfo } from '../services/gemma.js';
import { reviewPullRequest, reviewProject, isReviewable, REVIEW_LIMITS } from '../services/review.js';
import { readZip } from '../lib/unzip.js';

const reposLimit = rateLimiter({ windowMs: 60e3, max: 20, key: (req) => `orbit-repos:${req.user?.id || clientIp(req)}` });
const searchLimit = rateLimiter({ windowMs: 60e3, max: 40, key: (req) => `search:${req.user?.id || clientIp(req)}` });
const reviewLimit = rateLimiter({ windowMs: 60e3, max: 10, key: (req) => `review:${req.user?.id || clientIp(req)}` });
const chatLimit = rateLimiter({ windowMs: 60e3, max: 15, key: (req) => `orbit-chat:${req.user?.id || clientIp(req)}` });

async function savedSkills(req) {
  if (!req.user) return { skills: [], experience: null, user: null };
  const [s, p] = await Promise.all([
    query("SELECT name FROM skills WHERE user_id = $1 AND status <> 'paused'", [req.user.id]),
    query('SELECT experience, profession, experience_months FROM profiles WHERE user_id = $1', [req.user.id]),
  ]);
  const pr = p.rows[0] || {};
  const skills = s.rows.map((r) => r.name);
  return { skills, experience: pr.experience || null, user: { name: req.user.displayName, skills, experience: pr.experience, profession: pr.profession, experienceMonths: pr.experience_months } };
}

// UI shows the assistant's name; the exact model id is returned as modelId and in /api/health.
const modelLabel = (m) => (m ? 'Orbit AI' : 'Orbit AI (offline)');

export function orbitRoutes(r) {
  r.get('/api/repositories', async (req, res) => {
    reposLimit(req);
    const q = parse(v.object({
      skills: v.string({ max: 500, optional: true }),
      experience: v.string({ max: 20, optional: true }),
      limit: v.int({ min: 1, max: 30, optional: true }),
      platforms: v.string({ max: 40, optional: true }),
    }), req.query, 'query');
    const mine = await savedSkills(req);
    const skills = [...new Set([...(q.skills ? q.skills.split(',').map((s) => s.trim()).filter(Boolean) : []), ...mine.skills])].slice(0, 20);
    const experience = (q.experience || mine.experience || 'beginner').toLowerCase();
    try {
      const platforms = (q.platforms || 'github,gitlab,bitbucket').split(',').map((p) => p.trim().toLowerCase()).filter((p) => ['github', 'gitlab', 'bitbucket'].includes(p));
      const out = await recommendRepositories({ skills, experience, limit: q.limit || 20, platforms });
      res.json({ data: out.data, sources: out.sources, cache: out.cache, tookMs: out.tookMs, checkedAt: new Date().toISOString(), basedOn: { skills, experience } });
    } catch (e) {
      if (e instanceof AppError) throw e;
      if (e.upstream) throw new AppError('UPSTREAM_ERROR', 'GitHub search is unavailable right now');
      throw e;
    }
  });

  // Live search across GitHub (name / description / topics). Fast: one API call, cached 10 min.
  r.get('/api/search/repositories', async (req, res) => {
    searchLimit(req);
    const q = parse(v.object({ q: v.string({ min: 2, max: 80 }), beginnerOnly: v.bool({ optional: true }) }), req.query, 'query');
    const mine = await savedSkills(req);
    const out = await searchRepos({ q: q.q, skills: mine.skills, experience: mine.experience || 'beginner', beginnerOnly: q.beginnerOnly !== false });
    res.json({ items: out.items, total: out.total, freshness: out.freshness });
  });

  // Full details (issues, maintainer metrics, docs score) for one GitHub repo — used when a search result is opened.
  r.get('/api/repositories/:id/details', async (req, res) => {
    reposLimit(req);
    const id = fromRepoId(String(req.params.id));
    if (!id) throw errors.validation('Details are available for GitHub repositories (owner__repo)');
    const mine = await savedSkills(req);
    res.json({ repository: await repoDetails({ ...id, skills: mine.skills, experience: mine.experience || 'beginner' }) });
  });

  r.get('/api/repositories/:id/roadmap', async (req, res) => {
    reposLimit(req);
    const raw = String(req.params.id);
    const id = /^(gl|bb)__/.test(raw) ? { platformId: raw } : fromRepoId(raw);
    if (!id) throw errors.validation('Repository id must look like owner__repo, gl__<id> or bb__<workspace>__<slug>');
    const mine = await savedSkills(req);
    const skills = req.query.skills ? String(req.query.skills).split(',').slice(0, 20) : mine.skills;
    res.json(await buildRoadmap({ ...id, skills, experience: req.query.experience || mine.experience || 'beginner' }));
  });

  // Dummy PR: Gemma reviews pasted code like a maintainer. Login optional; signed-in reviews are saved.
  r.post('/api/review', async (req, res) => {
    if (req.session) requireCsrf(req);
    reviewLimit(req);
    const b = parse(v.object({
      title: v.string({ min: 3, max: REVIEW_LIMITS.titleMax }),
      description: v.string({ max: REVIEW_LIMITS.descriptionMax, optional: true, nullable: true }),
      code: v.string({ min: 1, max: REVIEW_LIMITS.maxChars, trim: false }),
      filename: v.string({ max: 120, optional: true, nullable: true }),
      language: v.string({ max: 40, optional: true, nullable: true }),
      repo: v.string({ max: 140, optional: true, nullable: true }),
    }), req.body);
    if (!b.code.trim()) throw errors.validation('code cannot be empty', [{ field: 'code', message: 'cannot be empty' }]);
    const lines = b.code.split('\n').length;
    if (lines > REVIEW_LIMITS.maxLines) throw errors.validation(`code is ${lines} lines; the limit is ${REVIEW_LIMITS.maxLines} lines per Dummy PR`, [{ field: 'code', message: 'too many lines' }]);
    // Long files are reviewed in chunks (same merged format as zip projects).
    const review = lines > 400
      ? await reviewProject({ title: b.title, description: b.description, repo: b.repo, files: [{ path: b.filename || 'pasted-code', content: b.code }] })
      : await reviewPullRequest(b);
    if (req.user) {
      await query('INSERT INTO pr_reviews (user_id, title, language, verdict, issues, model) VALUES ($1,$2,$3,$4,$5,$6)',
        [req.user.id, b.title, review.language, review.verdict, review.files ? review.files.reduce((n, f) => n + f.comments.length, 0) : review.comments.length, review.model.id]).catch(() => {});
    }
    res.json({ ...review, title: b.title, reviewedAt: new Date().toISOString() });
  });

  // Dummy PR from a .zip: unpacked in memory (never executed), most relevant source files reviewed by Gemma.
  r.post('/api/review/zip', { bodyLimit: 12 * 1024 * 1024 }, async (req, res) => {
    if (req.session) requireCsrf(req);
    reviewLimit(req);
    const b = parse(v.object({
      title: v.string({ min: 3, max: REVIEW_LIMITS.titleMax }),
      description: v.string({ max: REVIEW_LIMITS.descriptionMax, optional: true, nullable: true }),
      repo: v.string({ max: 140, optional: true, nullable: true }),
      filename: v.string({ max: 200, optional: true, nullable: true }),
      zipBase64: v.string({ min: 20, max: 12 * 1024 * 1024, trim: false }),
    }), req.body);
    const buf = Buffer.from(b.zipBase64.replace(/^data:[^,]*,/, ''), 'base64');
    if (buf.length > 8 * 1024 * 1024) throw errors.validation('The zip is larger than 8 MB — remove node_modules, build folders and assets, then try again');
    const { files, skipped } = readZip(buf, { filter: isReviewable });
    if (!files.length) throw errors.validation('No reviewable source files found in the zip (node_modules, build output, binaries and lock files are ignored)');
    const review = await reviewProject({ title: b.title, description: b.description, repo: b.repo, files, skipped: skipped.filter((x) => x.reason !== 'not a source file').slice(0, 50) });
    review.ignoredCount = skipped.filter((x) => x.reason === 'not a source file').length;
    review.archive = { name: b.filename || 'upload.zip', sourceFiles: files.length };
    if (req.user) {
      await query('INSERT INTO pr_reviews (user_id, title, language, verdict, issues, model) VALUES ($1,$2,$3,$4,$5,$6)',
        [req.user.id, b.title, review.language.slice(0, 100), review.verdict, review.files.reduce((n, f) => n + f.comments.length, 0), review.model.id]).catch(() => {});
    }
    res.json({ ...review, title: b.title, reviewedAt: new Date().toISOString() });
  });

  r.post('/api/chat', async (req, res) => {
    chatLimit(req);
    const b = parse(v.object({
      messages: v.array(v.object({ role: v.enum(['user', 'assistant', 'system']), content: v.string({ min: 1, max: 8000 }) }, { strict: false }), { max: 100 }),
      repoContext: v.object({ id: v.string({ max: 150 }), name: v.string({ max: 100, optional: true }), owner: v.string({ max: 39, optional: true }) }, { optional: true, nullable: true, strict: false }),
      model: v.string({ max: 100, optional: true }), // ignored: the server decides the model (always Gemma)
    }, { strict: false }), req.body);
    const msgs = b.messages.filter((m) => m.role !== 'system');
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== 'user') throw errors.validation('The last message must be from the user');
    const message = last.content.slice(0, LIMITS.message);
    const history = msgs.slice(0, -1).slice(-LIMITS.historyItems).map((m) => ({ role: m.role, content: m.content.slice(0, LIMITS.historyItemChars) }));

    const mine = await savedSkills(req);
    let sources = [], documents = [], issue = null;
    if (b.repoContext?.id && /^(gl|bb)__/.test(b.repoContext.id)) {
      try {
        const d = await platformDocs(b.repoContext.id);
        if (d) {
          if (d.readme) { sources.push({ id: 'S1', title: `${d.fullName} README`, url: d.url }); documents.push({ kind: 'readme', content: d.readme.content, sourceId: 'S1', truncated: d.readme.truncated }); }
          if (d.contributing) { sources.push({ id: 'S2', title: `${d.fullName} CONTRIBUTING`, url: d.url }); documents.push({ kind: 'contributing', content: d.contributing.content, sourceId: 'S2', truncated: d.contributing.truncated }); }
        }
      } catch { /* optional */ }
    } else if (b.repoContext?.id) {
      const id = fromRepoId(b.repoContext.id) || (b.repoContext.owner && b.repoContext.name ? fromRepoId(`${b.repoContext.owner}__${b.repoContext.name}`) : null);
      if (id) {
        // Server fetches the authoritative docs — the client only names the repo.
        try {
          const d = (await getRepoDocs(id.owner, id.repo)).data;
          const url = `https://github.com/${id.owner}/${id.repo}`;
          if (d.readme) { sources.push({ id: 'S1', title: `${id.owner}/${id.repo} README`, url: `${url}#readme` }); documents.push({ kind: 'readme', content: d.readme.content, sourceId: 'S1', truncated: d.readme.truncated }); }
          if (d.contributing) { sources.push({ id: 'S2', title: `${id.owner}/${id.repo} ${d.contributing.path}`, url: `${url}/blob/HEAD/${d.contributing.path}` }); documents.push({ kind: 'contributing', content: d.contributing.content, sourceId: 'S2', truncated: d.contributing.truncated }); }
          issue = { owner: id.owner, repo: id.repo, number: 0, title: `(repository-level question about ${id.owner}/${id.repo})` };
        } catch { /* docs optional; mentor will say it lacks context */ }
      }
    }
    const context = buildMentorContext({ skills: mine.skills, experience: mine.experience || 'beginner', issue, documents, sources });
    try {
      const out = await mentorChat({ message, history, context, sources, user: mine.user });
      const refs = out.sources.length ? `\n\n---\n**Sources:** ${out.sources.map((s) => `[${s.id}] [${s.title}](${s.url})`).join(' · ')}` : '';
      const cav = out.caveats.length ? `\n\n> ${out.caveats.join('\n> ')}` : '';
      res.json({ response: out.answer + refs + cav, model: modelLabel(out.model), modelId: out.model.id, sources: out.sources, caveats: out.caveats, latencyMs: out.model.latencyMs });
    } catch (e) {
      if (!(e instanceof AppError) || !['MODEL_UNAVAILABLE', 'UPSTREAM_TIMEOUT', 'RATE_LIMITED'].includes(e.code)) throw e;
      // Return 200 with an HONEST message so the UI never substitutes a canned "AI" reply.
      res.json({
        response: `⚠️ **Orbit AI is not reachable right now** (${e.code}).\n\n${e.message}. This is not an AI answer — please try again in a moment.`,
        model: modelLabel(null),
        sources: [], caveats: [e.message],
        error: { code: e.code, retryable: true, ...(e.retryAfterSeconds ? { retryAfterSeconds: e.retryAfterSeconds } : {}) },
        configured: gemmaInfo().provider !== 'none',
      });
    }
  });
}

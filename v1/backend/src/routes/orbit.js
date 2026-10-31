// Endpoints in the exact shape the Orbit frontend calls (src/services/api.ts):
//   GET  /api/repositories?skills=&experience=     -> Repository[]
//   GET  /api/repositories/:id/roadmap             -> ContributionRoadmap   (id = "owner__repo")
//   POST /api/chat {messages, repoContext}         -> {response, model, sources, caveats}
// Work without login (the frontend has none yet); signed-in users get their saved skills merged in.
import { query } from '../db/pool.js';
import { errors, AppError } from '../lib/errors.js';
import { v, parse } from '../lib/validate.js';
import { rateLimiter, clientIp } from '../lib/security.js';
import { recommendRepositories, buildRoadmap, fromRepoId } from '../services/orbit.js';
import { getRepoDocs } from '../services/github.js';
import { mentorChat, buildMentorContext, LIMITS } from '../services/mentor.js';
import { gemmaInfo } from '../services/gemma.js';

const reposLimit = rateLimiter({ windowMs: 60e3, max: 20, key: (req) => `orbit-repos:${req.user?.id || clientIp(req)}` });
const chatLimit = rateLimiter({ windowMs: 60e3, max: 15, key: (req) => `orbit-chat:${req.user?.id || clientIp(req)}` });

async function savedSkills(req) {
  if (!req.user) return { skills: [], experience: null };
  const [s, p] = await Promise.all([
    query("SELECT name FROM skills WHERE user_id = $1 AND status <> 'paused'", [req.user.id]),
    query('SELECT experience FROM profiles WHERE user_id = $1', [req.user.id]),
  ]);
  return { skills: s.rows.map((r) => r.name), experience: p.rows[0]?.experience || null };
}

const modelLabel = (m) => (m ? `Google Gemma · ${m.id}` : 'Google Gemma (offline)');

export function orbitRoutes(r) {
  r.get('/api/repositories', async (req, res) => {
    reposLimit(req);
    const q = parse(v.object({
      skills: v.string({ max: 500, optional: true }),
      experience: v.string({ max: 20, optional: true }),
      limit: v.int({ min: 1, max: 12, optional: true }),
    }), req.query, 'query');
    const mine = await savedSkills(req);
    const skills = [...new Set([...(q.skills ? q.skills.split(',').map((s) => s.trim()).filter(Boolean) : []), ...mine.skills])].slice(0, 20);
    const experience = (q.experience || mine.experience || 'beginner').toLowerCase();
    try {
      const data = await recommendRepositories({ skills, experience, limit: q.limit || 8 });
      res.json({ data, checkedAt: new Date().toISOString(), basedOn: { skills, experience } });
    } catch (e) {
      if (e instanceof AppError) throw e;
      if (e.upstream) throw new AppError('UPSTREAM_ERROR', 'GitHub search is unavailable right now');
      throw e;
    }
  });

  r.get('/api/repositories/:id/roadmap', async (req, res) => {
    reposLimit(req);
    const id = fromRepoId(req.params.id);
    if (!id) throw errors.validation('Repository id must look like owner__repo');
    const mine = await savedSkills(req);
    const skills = req.query.skills ? String(req.query.skills).split(',').slice(0, 20) : mine.skills;
    res.json(await buildRoadmap({ ...id, skills, experience: req.query.experience || mine.experience || 'beginner' }));
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
    if (b.repoContext?.id) {
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
      const out = await mentorChat({ message, history, context, sources });
      const refs = out.sources.length ? `\n\n---\n**Sources:** ${out.sources.map((s) => `[${s.id}] [${s.title}](${s.url})`).join(' · ')}` : '';
      const cav = out.caveats.length ? `\n\n> ${out.caveats.join('\n> ')}` : '';
      res.json({ response: out.answer + refs + cav, model: modelLabel(out.model), sources: out.sources, caveats: out.caveats, latencyMs: out.model.latencyMs });
    } catch (e) {
      if (!(e instanceof AppError) || !['MODEL_UNAVAILABLE', 'UPSTREAM_TIMEOUT', 'RATE_LIMITED'].includes(e.code)) throw e;
      // Return 200 with an HONEST message so the UI never substitutes a canned "AI" reply.
      res.json({
        response: `⚠️ **Gemma is not reachable right now** (${e.code}).\n\n${e.message}. This is not an AI answer — please try again in a moment.`,
        model: modelLabel(null),
        sources: [], caveats: [e.message],
        error: { code: e.code, retryable: true, ...(e.retryAfterSeconds ? { retryAfterSeconds: e.retryAfterSeconds } : {}) },
        configured: gemmaInfo().provider !== 'none',
      });
    }
  });
}

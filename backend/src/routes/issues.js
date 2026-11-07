// Contract v1: issue discovery, issue detail with grounded docs, Gemma mentor, resources, health.
import { query } from '../db/pool.js';
import { errors } from '../lib/errors.js';
import { v, parse } from '../lib/validate.js';
import { requireAuth, requireCsrf } from '../lib/session.js';
import { rateLimiter } from '../lib/security.js';
import { resolveSkill, githubLanguagesFor } from '../services/skillGraph.js';
import { searchBeginnerIssues, getIssueLive, getRepoMeta, getRepoDocs, assertRepoId, githubRateInfo } from '../services/github.js';
import { scoreIssue, firstStepFor, MIN_SCORE } from '../services/matching.js';
import { mentorChat, buildMentorContext, LIMITS } from '../services/mentor.js';
import { gemmaStatus, gemmaInfo } from '../services/gemma.js';
import { config } from '../config.js';

export const ISSUE_LIMITS = { defaultLimit: 10, maxLimit: 25, maxLanguages: 3, maxPage: 10 };
const mentorLimit = rateLimiter({ windowMs: 60e3, max: 15, key: (req) => `mentor:${req.user.id}` });
const issuesLimit = rateLimiter({ windowMs: 60e3, max: 30, key: (req) => `issues:${req.user.id}` });

async function userContext(userId) {
  const [s, p] = await Promise.all([
    query("SELECT slug, name, proficiency, status FROM skills WHERE user_id = $1 AND status <> 'paused'", [userId]),
    query('SELECT experience FROM profiles WHERE user_id = $1', [userId]),
  ]);
  return { skills: s.rows, experience: p.rows[0]?.experience || 'beginner' };
}

function toContractIssue(raw, { languages, scored, checkedAt, freshness, sources, firstStep }) {
  return {
    id: raw.nodeId || `${raw.owner}/${raw.repo}#${raw.number}`,
    owner: raw.owner, repo: raw.repo, number: raw.number,
    title: raw.title, url: raw.url, body: raw.body, labels: raw.labels,
    languages, state: raw.state === 'open' ? 'open' : 'closed', assignees: raw.assignees,
    updatedAt: raw.updatedAt, checkedAt, freshness,
    matchedSkills: scored.matchedSkills, prerequisiteGaps: scored.prerequisiteGaps, fitReasons: scored.fitReasons,
    difficulty: scored.difficulty, uncertainty: scored.uncertainty, firstStep, sources,
    ranking: scored.ranking, // extra (documented): transparent deterministic score + breakdown
    comments: raw.comments,
  };
}

const encodeCursor = (page) => Buffer.from(JSON.stringify({ p: page })).toString('base64url');
function decodeCursor(c) {
  try { const { p } = JSON.parse(Buffer.from(c, 'base64url').toString()); if (!Number.isInteger(p) || p < 1 || p > ISSUE_LIMITS.maxPage) throw 0; return p; }
  catch { throw errors.validation('Invalid cursor', [{ field: 'cursor', message: 'invalid' }]); }
}

// Shared by issue detail + mentor: authoritative context built by the server, never by the client.
export async function buildIssueContext(owner, repo, number, user) {
  assertRepoId(owner, repo, number);
  const checkedAt = new Date().toISOString();
  const [issue, meta, docs] = await Promise.all([
    getIssueLive(owner, repo, number),
    getRepoMeta(owner, repo).catch(() => null),
    getRepoDocs(owner, repo).catch(() => null),
  ]);
  if (issue.isPullRequest) throw errors.notFound('That number is a pull request, not an issue');
  const sources = [{ id: 'S1', title: `Issue #${number}: ${issue.title}`, url: issue.url }];
  const documents = [];
  const missingContext = [];
  const repoUrl = `https://github.com/${owner}/${repo}`;
  const d = docs?.data;
  if (d?.readme) { sources.push({ id: 'S2', title: `${owner}/${repo} README`, url: `${repoUrl}#readme` }); documents.push({ kind: 'readme', content: d.readme.content, sourceId: 'S2', truncated: d.readme.truncated }); }
  else missingContext.push('README could not be retrieved');
  if (d?.contributing) { sources.push({ id: 'S3', title: `${owner}/${repo} ${d.contributing.path}`, url: `${repoUrl}/blob/HEAD/${d.contributing.path}` }); documents.push({ kind: 'contributing', content: d.contributing.content, sourceId: 'S3', truncated: d.contributing.truncated }); }
  else missingContext.push('No CONTRIBUTING guide found in the usual locations');
  if (d?.community) {
    const c = d.community;
    sources.push({ id: 'S4', title: `${owner}/${repo} community profile`, url: `${repoUrl}/community` });
    documents.push({ kind: 'community', sourceId: 'S4', truncated: false, content: `Community health: ${c.healthPercentage ?? 'unknown'}%. Code of conduct: ${c.hasCodeOfConduct ? 'yes' : 'no'}. Issue template: ${c.hasIssueTemplate ? 'yes' : 'no'}. Pull request template: ${c.hasPullRequestTemplate ? 'yes' : 'no'}. License: ${c.license || (c.hasLicense ? 'present' : 'none found')}.` });
  }
  if (!meta) missingContext.push('Repository metadata (languages) unavailable');
  missingContext.push('Source code was not retrieved or inspected');
  const languages = meta?.data?.languages || [];
  const scored = scoreIssue(issue, { repoLanguages: languages, userSkills: user.skills, experience: user.experience });
  if (meta?.data?.archived) scored.uncertainty.unshift('Repository is archived — contributions are not accepted');
  if (issue.state !== 'open') scored.uncertainty.unshift('This issue is now closed');
  if (issue.assignees.length) scored.uncertainty.unshift(`Now assigned to ${issue.assignees.join(', ')}`);
  const checklist = buildChecklist(d?.contributing?.content || '', !!d?.contributing);
  const firstStep = d?.contributing
    ? { text: `Read ${d.contributing.path} [S3] and the full issue thread [S1], then comment on the issue to confirm it's still available before you start.`, sourceIds: ['S3', 'S1'] }
    : firstStepFor(issue, ['S1']);
  return { issue, meta: meta?.data || null, sources, documents, missingContext, scored, checklist, firstStep, checkedAt, freshness: 'live', languages };
}

// Checklist: "documented" only if the CONTRIBUTING guide actually mentions it; otherwise "suggested".
export function buildChecklist(contrib, hasContrib) {
  const t = contrib.toLowerCase();
  const doc = (re) => hasContrib && re.test(t);
  const item = (id, text, documented) => ({ id, text, kind: documented ? 'documented' : 'suggested', sourceIds: documented ? ['S3'] : [] });
  return [
    item('guidelines', 'Read the contribution guidelines and code of conduct', hasContrib),
    { id: 'understand', text: 'Understand the issue; reproduce the problem if it is a bug', kind: 'suggested', sourceIds: ['S1'] },
    item('setup', 'Set up the project locally following the documented steps', doc(/(install|setup|set up|getting started|npm |pip |yarn |cargo |make )/)),
    item('branch', 'Fork the repository and create a new branch for your change', doc(/(fork|branch)/)),
    { id: 'change', text: 'Make a small, focused change that addresses only this issue', kind: 'suggested', sourceIds: [] },
    item('checks', 'Run the project’s tests / linters before committing', doc(/(test|lint|format|prettier|eslint|pytest|ci)/)),
    item('pr', 'Open a pull request that references the issue and follows the PR template', doc(/(pull request|\bpr\b|merge request)/)),
  ];
}

export function issueRoutes(r) {
  r.get('/api/issues', requireAuth, async (req, res) => {
    issuesLimit(req);
    const q = parse(v.object({
      skills: v.string({ max: 500, optional: true }),
      cursor: v.string({ max: 100, optional: true }),
      limit: v.int({ min: 1, max: ISSUE_LIMITS.maxLimit, optional: true }),
      includeAssigned: v.bool({ optional: true }),
    }), req.query, 'query');
    const limit = q.limit || ISSUE_LIMITS.defaultLimit;
    const page = q.cursor ? decodeCursor(q.cursor) : 1;
    const user = await userContext(req.user.id);
    // Filter skills only narrow the search; they don't change who can see what.
    const filterSlugs = q.skills ? q.skills.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20).map((s) => resolveSkill(s).slug) : user.skills.map((s) => s.slug);
    const languages = githubLanguagesFor(filterSlugs).slice(0, ISSUE_LIMITS.maxLanguages);
    const perLang = Math.min(30, Math.ceil((limit * 1.6) / Math.max(1, languages.length)));
    const results = await Promise.all((languages.length ? languages : [null]).map((language) =>
      searchBeginnerIssues({ language, page, perPage: perLang, includeAssigned: !!q.includeAssigned }).then((x) => ({ ...x, language }))));
    const seen = new Set();
    const items = [];
    let anyMore = false;
    for (const res0 of results) {
      if (res0.data.total > page * perLang) anyMore = true;
      for (const raw of res0.data.items) {
        const key = `${raw.owner}/${raw.repo}#${raw.number}`.toLowerCase();
        if (seen.has(key) || raw.isPullRequest || raw.state !== 'open') continue;
        if (!q.includeAssigned && raw.assignees.length) continue;
        seen.add(key);
        const langs = res0.language ? [res0.language] : [];
        const scored = scoreIssue(raw, { repoLanguages: langs, userSkills: user.skills, experience: user.experience });
        if (scored.ranking.score < MIN_SCORE) continue;
        scored.uncertainty.push('Repository languages inferred from the search filter; open the issue for full details');
        const sources = [{ id: 'S1', title: `Issue #${raw.number}: ${raw.title}`, url: raw.url }];
        items.push(toContractIssue(raw, { languages: langs, scored, checkedAt: res0.fetchedAt, freshness: res0.freshness, sources, firstStep: firstStepFor(raw, ['S1']) }));
      }
    }
    items.sort((a, b) => b.ranking.score - a.ranking.score || b.updatedAt.localeCompare(a.updatedAt));
    const checkedAt = results.map((x) => x.fetchedAt).sort()[0] || new Date().toISOString();
    res.json({ items: items.slice(0, limit), nextCursor: anyMore && page < ISSUE_LIMITS.maxPage ? encodeCursor(page + 1) : null, checkedAt, searchedLanguages: languages });
  });

  r.get('/api/issues/:owner/:repo/:number', requireAuth, async (req, res) => {
    issuesLimit(req);
    const number = Number(req.params.number);
    assertRepoId(req.params.owner, req.params.repo, number);
    const user = await userContext(req.user.id);
    const ctx = await buildIssueContext(req.params.owner, req.params.repo, number, user);
    res.json({
      issue: toContractIssue(ctx.issue, { languages: ctx.languages, scored: ctx.scored, checkedAt: ctx.checkedAt, freshness: 'live', sources: ctx.sources, firstStep: ctx.firstStep }),
      documents: ctx.documents, sources: ctx.sources, missingContext: ctx.missingContext, checklist: ctx.checklist,
      repository: ctx.meta,
    });
  });

  r.post('/api/mentor/chat', requireAuth, requireCsrf, async (req, res) => {
    mentorLimit(req);
    const b = parse(v.object({
      message: v.string({ min: 1, max: LIMITS.message }),
      history: v.array(v.object({ role: v.enum(['user', 'assistant']), content: v.string({ min: 1, max: LIMITS.historyItemChars }) }), { max: 50, optional: true }),
      issue: v.object({ owner: v.string({ max: 39 }), repo: v.string({ max: 100 }), number: v.int({ min: 1 }) }, { optional: true, nullable: true }),
    }), req.body);
    const history = (b.history || []).slice(-LIMITS.historyItems);
    const user = await userContext(req.user.id);
    let sources = [], documents = [], issue = null;
    if (b.issue) {
      const ctx = await buildIssueContext(b.issue.owner, b.issue.repo, b.issue.number, user);
      sources = ctx.sources;
      issue = ctx.issue;
      documents = [{ kind: 'issue', content: `Title: ${ctx.issue.title}\nLabels: ${ctx.issue.labels.join(', ')}\nState: ${ctx.issue.state}\n\n${ctx.issue.body || '(no description)'}`, sourceId: 'S1', truncated: false }, ...ctx.documents];
    }
    const context = buildMentorContext({ skills: user.skills.map((s) => s.name), experience: user.experience, issue, documents, sources });
    const out = await mentorChat({ message: b.message, history, context, sources, user: { name: req.user.displayName, skills: user.skills.map((s) => s.name), experience: user.experience } });
    res.json(out);
  });

  r.get('/api/resources', async (req, res) => {
    const q = parse(v.object({ topic: v.string({ max: 60, optional: true }) }), req.query, 'query');
    const topic = q.topic ? resolveSkill(q.topic).slug : null;
    const { rows } = topic
      ? await query('SELECT * FROM learning_resources WHERE topic = $1 OR $1 = ANY(string_to_array(topic, \',\')) ORDER BY title', [topic])
      : await query('SELECT * FROM learning_resources ORDER BY topic, title');
    res.json({ items: rows.map((x) => ({ id: x.id, title: x.title, topic: x.topic, url: x.url, kind: x.kind, reviewedAt: x.reviewed_at ? new Date(x.reviewed_at).toISOString() : null })) });
  });

  r.get('/api/health', async (req, res) => {
    let database = 'unavailable';
    try { await query('SELECT 1'); database = 'ready'; } catch { /* stays unavailable */ }
    const rate = githubRateInfo();
    const github = rate.remaining === 0 ? 'unavailable' : 'ready';
    const gemma = await gemmaStatus();
    const status = database === 'ready' && gemma === 'ready' && github === 'ready' ? 'ok' : 'degraded';
    res.json({ status, dependencies: { database, github, gemma }, model: gemma === 'unconfigured' ? null : { family: 'Google Gemma', provider: gemmaInfo().provider, id: gemmaInfo().model }, githubAuth: config.githubToken ? 'token' : 'anonymous' });
  });
}

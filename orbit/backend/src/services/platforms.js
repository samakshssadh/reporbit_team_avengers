// GitLab + Bitbucket public APIs (fixed hosts, timeouts, cached). Used alongside GitHub for discovery.
// Everything is best-effort: if a platform is slow or down, discovery still returns the other platforms.
import { cached } from './github.js';
import { AppError } from '../lib/errors.js';

const GITLAB = (process.env.GITLAB_API_URL || 'https://gitlab.com/api/v4').replace(/\/$/, '');
const BITBUCKET = (process.env.BITBUCKET_API_URL || 'https://api.bitbucket.org/2.0').replace(/\/$/, '');
const TIMEOUT = 6000;
const MAX_DOC = 12000;

async function getJson(url, { raw = false } = {}) {
  let r;
  try { r = await fetch(url, { headers: { Accept: raw ? 'text/plain' : 'application/json', 'User-Agent': 'reporbit' }, signal: AbortSignal.timeout(TIMEOUT) }); }
  catch (e) { throw new AppError(e.name === 'TimeoutError' ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR', 'Platform unreachable'); }
  if (r.status === 404) return null;
  if (r.status === 429) throw new AppError('RATE_LIMITED', 'Platform rate limit', { retryAfterSeconds: 60 });
  if (!r.ok) throw new AppError('UPSTREAM_ERROR', `Platform HTTP ${r.status}`);
  return raw ? r.text() : r.json();
}

// GitLab language names match GitHub's (Python, JavaScript, TypeScript, Go, ...).
const BEGINNER_LABELS = ['good first issue', 'good-first-issue', 'beginner', 'first-timers-only', 'easy', 'newcomer', 'quick win'];

export async function gitlabCandidates(language, limit = 6) {
  const key = `gitlab:${language || 'any'}:${limit}`;
  return (await cached(key, 1800, async () => {
    const q = new URLSearchParams({ visibility: 'public', order_by: 'star_count', sort: 'desc', per_page: String(Math.min(30, limit * 3)), archived: 'false', last_activity_after: new Date(Date.now() - 180 * 86400e3).toISOString() });
    if (language) q.set('with_programming_language', language);
    const projects = (await getJson(`${GITLAB}/projects?${q}`)) || [];
    const out = [];
    await Promise.all(projects.slice(0, limit * 2).map(async (p) => {
      try {
        const iq = new URLSearchParams({ state: 'opened', per_page: '20', order_by: 'updated_at' });
        const issues = ((await getJson(`${GITLAB}/projects/${p.id}/issues?${iq}`)) || [])
          .filter((i) => !(i.assignees || []).length && (i.labels || []).some((l) => BEGINNER_LABELS.includes(String(l).toLowerCase())));
        const langs = Object.keys((await getJson(`${GITLAB}/projects/${p.id}/languages`)) || {});
        out.push({
          platform: 'gitlab', id: `gl__${p.id}`, projectId: p.id,
          owner: p.namespace?.path || p.path_with_namespace.split('/')[0], name: p.path, fullName: p.path_with_namespace,
          description: p.description || '', url: p.web_url, stars: p.star_count ?? 0, forks: p.forks_count ?? 0,
          openIssues: p.open_issues_count ?? 0, topics: (p.topics || p.tag_list || []).slice(0, 8),
          language: langs[0] || language || null, languages: langs.slice(0, 6), pushedAt: p.last_activity_at,
          issues: issues.map((i) => ({ nodeId: `gl_${i.id}`, number: i.iid, title: i.title, url: i.web_url, labels: i.labels || [], body: i.description ? String(i.description).slice(0, 4000) : null, comments: i.user_notes_count ?? 0, updatedAt: i.updated_at, state: 'open', assignees: [], isPullRequest: false })),
        });
      } catch { /* skip project */ }
    }));
    return out.sort((a, b) => b.issues.length - a.issues.length || b.stars - a.stars).slice(0, limit);
  })).data;
}

export async function bitbucketCandidates(language, limit = 3) {
  const key = `bitbucket:${language || 'any'}:${limit}`;
  return (await cached(key, 1800, async () => {
    const lang = (language || '').toLowerCase();
    const q = new URLSearchParams({ pagelen: String(Math.min(30, limit * 4)), sort: '-updated_on' });
    q.set('q', lang ? `language="${lang.replace(/"/g, '')}" AND has_issues=true` : 'has_issues=true');
    const res = await getJson(`${BITBUCKET}/repositories?${q}`);
    const repos = (res?.values || []).filter((r) => !r.is_private);
    const out = [];
    await Promise.all(repos.slice(0, limit * 2).map(async (r) => {
      try {
        const [ws, slug] = r.full_name.split('/');
        const iss = await getJson(`${BITBUCKET}/repositories/${ws}/${slug}/issues?pagelen=20&q=${encodeURIComponent('(state="new" OR state="open") AND assignee=null')}&sort=-updated_on`);
        const issues = (iss?.values || []).filter((i) => ['trivial', 'minor'].includes(i.priority) || /good first|beginner|easy/i.test(`${i.title} ${i.content?.raw || ''}`));
        out.push({
          platform: 'bitbucket', id: `bb__${ws}__${slug}`, owner: ws, name: slug, fullName: r.full_name,
          description: r.description || '', url: r.links?.html?.href || `https://bitbucket.org/${r.full_name}`,
          stars: 0, forks: 0, openIssues: (iss?.size ?? (iss?.values || []).length) || 0, topics: [],
          language: r.language ? r.language.replace(/^./, (c) => c.toUpperCase()) : language, languages: r.language ? [r.language.replace(/^./, (c) => c.toUpperCase())] : [],
          pushedAt: r.updated_on, starsUnknown: true,
          issues: issues.map((i) => ({ nodeId: `bb_${ws}_${slug}_${i.id}`, number: i.id, title: i.title, url: i.links?.html?.href || `https://bitbucket.org/${r.full_name}/issues/${i.id}`, labels: [i.kind, i.priority].filter(Boolean), body: i.content?.raw ? String(i.content.raw).slice(0, 4000) : null, comments: 0, updatedAt: i.updated_on, state: 'open', assignees: [], isPullRequest: false })),
        });
      } catch { /* skip repo */ }
    }));
    return out.filter((r) => r.issues.length).slice(0, limit);
  })).data;
}

// README for GitLab / Bitbucket repos (roadmap + Orbit AI grounding). Fixed hosts only.
export async function platformDocs(id) {
  if (id.startsWith('gl__')) {
    const pid = id.slice(4);
    if (!/^\d{1,12}$/.test(pid)) return null;
    return (await cached(`gldocs:${pid}`, 3600, async () => {
      const p = await getJson(`${GITLAB}/projects/${pid}`);
      if (!p) return null;
      const branch = encodeURIComponent(p.default_branch || 'main');
      let readme = null, contributing = null;
      for (const f of ['README.md', 'README.rst', 'README']) { readme = await getJson(`${GITLAB}/projects/${pid}/repository/files/${encodeURIComponent(f)}/raw?ref=${branch}`, { raw: true }).catch(() => null); if (readme) break; }
      for (const f of ['CONTRIBUTING.md', 'docs/CONTRIBUTING.md']) { contributing = await getJson(`${GITLAB}/projects/${pid}/repository/files/${encodeURIComponent(f)}/raw?ref=${branch}`, { raw: true }).catch(() => null); if (contributing) break; }
      return { fullName: p.path_with_namespace, url: p.web_url, language: null, readme: readme ? { content: readme.slice(0, MAX_DOC), truncated: readme.length > MAX_DOC } : null, contributing: contributing ? { content: contributing.slice(0, MAX_DOC), truncated: contributing.length > MAX_DOC, path: 'CONTRIBUTING.md' } : null };
    })).data;
  }
  if (id.startsWith('bb__')) {
    const m = /^bb__([A-Za-z0-9_.-]{1,62})__([A-Za-z0-9_.-]{1,100})$/.exec(id);
    if (!m) return null;
    const [, ws, slug] = m;
    return (await cached(`bbdocs:${ws}/${slug}`, 3600, async () => {
      const r = await getJson(`${BITBUCKET}/repositories/${ws}/${slug}`);
      if (!r) return null;
      const branch = encodeURIComponent(r.mainbranch?.name || 'main');
      const readme = await getJson(`${BITBUCKET}/repositories/${ws}/${slug}/src/${branch}/README.md`, { raw: true }).catch(() => null);
      const contributing = await getJson(`${BITBUCKET}/repositories/${ws}/${slug}/src/${branch}/CONTRIBUTING.md`, { raw: true }).catch(() => null);
      return { fullName: r.full_name, url: r.links?.html?.href, language: r.language || null, readme: readme ? { content: readme.slice(0, MAX_DOC), truncated: readme.length > MAX_DOC } : null, contributing: contributing ? { content: contributing.slice(0, MAX_DOC), truncated: contributing.length > MAX_DOC, path: 'CONTRIBUTING.md' } : null };
    })).data;
  }
  return null;
}

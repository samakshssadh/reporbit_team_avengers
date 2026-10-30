// GitHub REST API client: public data only, fixed host (no SSRF), timeouts, rate-limit handling,
// bounded document sizes, and a Postgres-backed cache with explicit freshness.
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { AppError, errors } from '../lib/errors.js';

const API = config.githubApiUrl; // fixed host from server config, never from user input
export const MAX_DOC_CHARS = 12000;
const TIMEOUT_MS = 8000;

export const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
export const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
export function assertRepoId(owner, repo, number) {
  if (!OWNER_RE.test(owner || '') || !REPO_RE.test(repo || '') || repo === '.' || repo === '..') throw errors.validation('Invalid repository identifier');
  if (number !== undefined && !(Number.isInteger(number) && number > 0 && number < 1e9)) throw errors.validation('Invalid issue number');
}

let lastRate = { remaining: null, resetAt: null };
export const githubRateInfo = () => ({ ...lastRate });

// path must start with "/" and is always appended to the fixed API host.
export async function gh(path, { accept = 'application/vnd.github+json', raw = false, allow404 = false } = {}) {
  if (!path.startsWith('/') || path.includes('..') || /^\/\//.test(path)) throw new Error('bad github path');
  const headers = { Accept: accept, 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'devpath-hackday-backend' };
  if (config.githubToken) headers.Authorization = `Bearer ${config.githubToken}`;
  let r;
  try {
    r = await fetch(API + path, { headers, signal: AbortSignal.timeout(TIMEOUT_MS), redirect: 'follow' });
  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') throw errors.timeout('GitHub took too long to respond');
    throw new AppError('UPSTREAM_ERROR', 'Could not reach GitHub');
  }
  const remaining = r.headers.get('x-ratelimit-remaining');
  const reset = r.headers.get('x-ratelimit-reset');
  if (remaining !== null) lastRate = { remaining: Number(remaining), resetAt: reset ? new Date(Number(reset) * 1000).toISOString() : null };
  if (r.status === 404 && allow404) return null;
  if (r.status === 404) throw errors.notFound('GitHub resource not found');
  if (r.status === 429 || (r.status === 403 && remaining === '0')) {
    const retry = Number(r.headers.get('retry-after')) || (reset ? Math.max(1, Number(reset) - Math.floor(Date.now() / 1000)) : 60);
    throw new AppError('RATE_LIMITED', 'GitHub rate limit reached', { retryAfterSeconds: Math.min(retry, 3600) });
  }
  if (r.status === 422) throw errors.validation('GitHub rejected the search query');
  if (!r.ok) throw new AppError('UPSTREAM_ERROR', `GitHub returned HTTP ${r.status}`);
  return raw ? r.text() : r.json();
}

// Cache wrapper. Returns {data, fetchedAt, freshness:'live'|'cached'}.
export async function cached(key, ttlSeconds, loader, { force = false } = {}) {
  if (!force) {
    const { rows } = await query('SELECT payload, fetched_at FROM context_cache WHERE key = $1 AND expires_at > now()', [key]);
    if (rows.length) return { data: rows[0].payload, fetchedAt: new Date(rows[0].fetched_at).toISOString(), freshness: 'cached' };
  }
  try {
    const data = await loader();
    await query(
      `INSERT INTO context_cache (key, payload, fetched_at, expires_at) VALUES ($1, $2, now(), now() + make_interval(secs => $3))
       ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, fetched_at = now(), expires_at = EXCLUDED.expires_at`,
      [key, JSON.stringify(data ?? null), ttlSeconds],
    );
    return { data, fetchedAt: new Date().toISOString(), freshness: 'live' };
  } catch (e) {
    // Serve stale data if GitHub is down/limited, clearly marked as cached.
    const { rows } = await query('SELECT payload, fetched_at FROM context_cache WHERE key = $1', [key]);
    if (rows.length && e instanceof AppError && ['RATE_LIMITED', 'UPSTREAM_TIMEOUT', 'UPSTREAM_ERROR'].includes(e.code)) {
      return { data: rows[0].payload, fetchedAt: new Date(rows[0].fetched_at).toISOString(), freshness: 'cached', stale: true };
    }
    throw e;
  }
}

// Beginner-friendly open, unassigned issues (never PRs) for one GitHub language.
export async function searchBeginnerIssues({ language, page = 1, perPage = 10, includeAssigned = false }) {
  const parts = ['is:issue', 'is:open', 'label:"good first issue"', 'archived:false'];
  if (!includeAssigned) parts.push('no:assignee');
  if (language) parts.push(`language:"${language.replace(/"/g, '')}"`);
  const q = encodeURIComponent(parts.join(' '));
  const key = `search:${parts.join(' ')}:p${page}:n${perPage}`;
  return cached(key, 600, async () => {
    const res = await gh(`/search/issues?q=${q}&sort=updated&order=desc&per_page=${perPage}&page=${page}`);
    return { total: res.total_count, items: (res.items || []).filter((i) => !i.pull_request).map(slimIssue) };
  });
}

export function slimIssue(i) {
  const m = /repos\/([^/]+)\/([^/]+)$/.exec(i.repository_url || '');
  return {
    nodeId: i.node_id,
    owner: m?.[1], repo: m?.[2], number: i.number,
    title: i.title, url: i.html_url,
    body: i.body ? String(i.body).slice(0, MAX_DOC_CHARS) : null,
    labels: (i.labels || []).map((l) => (typeof l === 'string' ? l : l.name)).filter(Boolean),
    state: i.state, assignees: (i.assignees || []).map((a) => a.login),
    comments: i.comments ?? 0, createdAt: i.created_at, updatedAt: i.updated_at,
    isPullRequest: !!i.pull_request, locked: !!i.locked,
    authorAssociation: i.author_association || null,
  };
}

export async function getIssueLive(owner, repo, number) {
  assertRepoId(owner, repo, number);
  const i = await gh(`/repos/${owner}/${repo}/issues/${number}`);
  return slimIssue(i);
}

export async function getRepoMeta(owner, repo) {
  assertRepoId(owner, repo);
  return cached(`repo:${owner}/${repo}`.toLowerCase(), 3600, async () => {
    const [r, langs] = await Promise.all([gh(`/repos/${owner}/${repo}`), gh(`/repos/${owner}/${repo}/languages`, { allow404: true })]);
    return {
      fullName: r.full_name, url: r.html_url, description: r.description, stars: r.stargazers_count,
      forks: r.forks_count ?? 0, openIssues: r.open_issues_count ?? 0, topics: (r.topics || []).slice(0, 8), homepage: r.homepage || null,
      language: r.language, languages: Object.keys(langs || {}).slice(0, 6), archived: r.archived,
      pushedAt: r.pushed_at, license: r.license?.spdx_id || null, defaultBranch: r.default_branch,
    };
  });
}

function truncate(text) {
  const s = String(text || '');
  return { content: s.slice(0, MAX_DOC_CHARS), truncated: s.length > MAX_DOC_CHARS };
}

// README + CONTRIBUTING + community profile, only from fixed API paths.
export async function getRepoDocs(owner, repo) {
  assertRepoId(owner, repo);
  return cached(`docs:${owner}/${repo}`.toLowerCase(), 3600, async () => {
    const raw = 'application/vnd.github.raw+json';
    const readme = await gh(`/repos/${owner}/${repo}/readme`, { accept: raw, raw: true, allow404: true });
    let contributing = null, contributingPath = null;
    for (const p of ['CONTRIBUTING.md', '.github/CONTRIBUTING.md', 'docs/CONTRIBUTING.md', 'CONTRIBUTING.rst', 'CONTRIBUTING']) {
      contributing = await gh(`/repos/${owner}/${repo}/contents/${p}`, { accept: raw, raw: true, allow404: true });
      if (contributing) { contributingPath = p; break; }
    }
    const community = await gh(`/repos/${owner}/${repo}/community/profile`, { allow404: true });
    return {
      readme: readme ? truncate(readme) : null,
      contributing: contributing ? { ...truncate(contributing), path: contributingPath } : null,
      community: community ? {
        healthPercentage: community.health_percentage ?? null,
        hasCodeOfConduct: !!community.files?.code_of_conduct,
        hasIssueTemplate: !!community.files?.issue_template,
        hasPullRequestTemplate: !!community.files?.pull_request_template,
        hasLicense: !!community.files?.license,
        license: community.files?.license?.spdx_id || null,
      } : null,
    };
  });
}

// Public PRs + issues authored by a GitHub user (for growth sync). Max 100 each.
export async function getUserContributions(login) {
  if (!OWNER_RE.test(login || '')) throw errors.validation('Invalid GitHub username');
  const fetchKind = async (type) => {
    const q = encodeURIComponent(`author:${login} type:${type}`);
    const res = await gh(`/search/issues?q=${q}&sort=created&order=desc&per_page=100`);
    return res.items || [];
  };
  const [prs, issues] = await Promise.all([fetchKind('pr'), fetchKind('issue')]);
  return [...prs, ...issues].map((i) => {
    const s = slimIssue(i);
    return {
      externalId: i.node_id,
      kind: i.pull_request ? 'pull_request' : 'issue',
      title: String(i.title).slice(0, 300),
      url: i.html_url,
      owner: s.owner, repo: s.repo,
      status: i.pull_request ? (i.pull_request.merged_at ? 'merged' : i.draft ? 'draft' : i.state === 'open' ? 'open' : 'closed') : (i.state === 'open' ? 'open' : 'completed'),
      occurredAt: i.created_at,
    };
  });
}

export async function getGithubUser(login) {
  if (!OWNER_RE.test(login || '')) throw errors.validation('Invalid GitHub username');
  return gh(`/users/${login}`);
}

// Real maintainer signals from the last 30 closed PRs (one search call, cached 6h).
export async function getPrMetrics(owner, repo) {
  assertRepoId(owner, repo);
  return cached(`prmetrics:${owner}/${repo}`.toLowerCase(), 6 * 3600, async () => {
    const q = encodeURIComponent(`repo:${owner}/${repo} is:pr is:closed`);
    const res = await gh(`/search/issues?q=${q}&sort=updated&order=desc&per_page=30`);
    const items = res.items || [];
    const merged = items.filter((i) => i.pull_request?.merged_at);
    const hours = merged.map((i) => (new Date(i.pull_request.merged_at) - new Date(i.created_at)) / 3600e3).filter((h) => h >= 0).sort((a, b) => a - b);
    const mid = Math.floor(hours.length / 2);
    const median = !hours.length ? null : hours.length % 2 ? hours[mid] : (hours[mid - 1] + hours[mid]) / 2;
    const maintainers = new Set(items.filter((i) => ['OWNER', 'MEMBER', 'COLLABORATOR'].includes(i.author_association)).map((i) => i.user?.login).filter(Boolean));
    return { sampled: items.length, merged: merged.length, medianHoursToMerge: median, maintainersSeen: maintainers.size };
  });
}

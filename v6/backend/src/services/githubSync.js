// Pulls a user's PUBLIC pull requests and issues from GitHub into `contributions` (idempotent),
// and derives "contributions before joining Reporbit" from that real history.
import { query, tx } from '../db/pool.js';
import { getUserContributions, getRepoMeta, getGithubUser } from './github.js';
import { skillForGithubLanguage } from './skillGraph.js';

const running = new Map();

export async function syncGithub(userId, login) {
  if (running.has(userId)) return running.get(userId); // de-duplicate concurrent syncs
  const job = (async () => {
    const items = await getUserContributions(login);
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
          [userId, it.kind, it.title, it.owner, it.repo, it.url, it.status, repoSkills.get(`${it.owner}/${it.repo}`) || [], it.occurredAt, it.externalId],
        );
        if (rows[0].inserted) inserted++; else updated++;
      }
      // Contributions made before joining Reporbit come from GitHub itself (no self-reporting).
      await c.query(
        `UPDATE profiles p SET prior_contributions = (
           SELECT count(*) FROM contributions c JOIN users u ON u.id = c.user_id
            WHERE c.user_id = $1 AND c.source = 'github' AND c.occurred_at < u.created_at)
         WHERE p.user_id = $1`, [userId]);
      await c.query('UPDATE users SET github_synced_at = now() WHERE id = $1', [userId]);
    });
    try {
      const u = await getGithubUser(login);
      await query('UPDATE users SET avatar_url = COALESCE(avatar_url, $1) WHERE id = $2', [u.avatar_url, userId]);
    } catch { /* optional */ }
    return { githubLogin: login, fetched: items.length, inserted, updated };
  })();
  running.set(userId, job);
  try { return await job; } finally { running.delete(userId); }
}

// Repos the user has really contributed to (from GitHub data): owner/name → counts.
export async function contributedRepos(userId) {
  const { rows } = await query(
    `SELECT lower(repo_owner || '/' || repo_name) AS repo, repo_owner, repo_name,
            count(*) FILTER (WHERE kind = 'pull_request')::int AS prs,
            count(*) FILTER (WHERE kind = 'pull_request' AND status = 'merged')::int AS merged,
            count(*) FILTER (WHERE kind = 'issue')::int AS issues,
            max(occurred_at) AS last_at
       FROM contributions WHERE user_id = $1 AND source = 'github' AND repo_owner IS NOT NULL
      GROUP BY 1, 2, 3 ORDER BY last_at DESC`, [userId]);
  return rows.map((r) => ({ repo: r.repo, fullName: `${r.repo_owner}/${r.repo_name}`, prs: r.prs, merged: r.merged, issues: r.issues, lastAt: r.last_at }));
}

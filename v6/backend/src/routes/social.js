// Social layer: follow people (private profiles need approval), follow repositories, weekly leaderboard.
// Privacy reuses profiles.is_public. Points come from activity we already record; nothing is self-reported.
import { query } from '../db/pool.js';
import { errors } from '../lib/errors.js';
import { v, parse } from '../lib/validate.js';
import { requireAuth, requireCsrf } from '../lib/session.js';
import { rateLimiter } from '../lib/security.js';

const auth = [requireAuth, requireCsrf];
const writeLimit = rateLimiter({ windowMs: 60e3, max: 40, key: (req) => `social:${req.user.id}` });
const searchLimit = rateLimiter({ windowMs: 60e3, max: 30, key: (req) => `social-search:${req.user.id}` });

const handleField = v.string({ min: 2, max: 39, lower: true, pattern: /^[a-z0-9][a-z0-9-]{1,38}$/ });
export const POINTS = { repoExplored: 1, dummyPR: 3, contribution: 10, activeDay: 2 };

const person = (r) => ({ handle: r.handle, displayName: r.display_name, avatarUrl: r.avatar_url, isPublic: !!r.is_public });

async function userByHandle(handle) {
  const { rows } = await query(
    'SELECT u.id, u.handle, u.display_name, u.avatar_url, COALESCE(p.is_public, false) AS is_public FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.handle = $1',
    [handle],
  );
  if (!rows.length) throw errors.notFound('No user with that handle');
  return rows[0];
}

// Points per user since `since` (null = all time). Every term maps to a real recorded action.
async function pointsFor(ids, since) {
  const { rows } = await query(
    `SELECT u.id,
       (SELECT count(DISTINCT repo_id) FROM repo_interactions ri WHERE ri.user_id = u.id AND ($2::timestamptz IS NULL OR ri.first_at >= $2))::int AS repos,
       (SELECT count(*) FROM pr_reviews pr WHERE pr.user_id = u.id AND ($2::timestamptz IS NULL OR pr.created_at >= $2))::int AS reviews,
       (SELECT count(*) FROM contributions c WHERE c.user_id = u.id AND ($2::timestamptz IS NULL OR c.occurred_at >= $2))::int AS contribs,
       (SELECT count(*) FROM user_activity ua WHERE ua.user_id = u.id AND ua.seconds > 0 AND ($2::timestamptz IS NULL OR ua.day >= $2::date))::int AS days
     FROM users u WHERE u.id = ANY($1::uuid[])`,
    [ids, since],
  );
  return new Map(rows.map((r) => [r.id, {
    repos: r.repos, reviews: r.reviews, contributions: r.contribs, activeDays: r.days,
    points: r.repos * POINTS.repoExplored + r.reviews * POINTS.dummyPR + r.contribs * POINTS.contribution + r.days * POINTS.activeDay,
  }]));
}

export function socialRoutes(r) {
  // ---- overview: counts, lists, pending requests
  r.get('/api/social/overview', requireAuth, async (req, res) => {
    const uid = req.user.id;
    const sel = 'u.handle, u.display_name, u.avatar_url, COALESCE(p.is_public, false) AS is_public, f.status, f.created_at';
    const join = 'JOIN users u ON u.id = f.%s LEFT JOIN profiles p ON p.user_id = u.id';
    const [following, followers, pending, me] = await Promise.all([
      query(`SELECT ${sel} FROM follows f ${join.replace('%s', 'followee_id')} WHERE f.follower_id = $1 ORDER BY f.created_at DESC LIMIT 200`, [uid]),
      query(`SELECT ${sel} FROM follows f ${join.replace('%s', 'follower_id')} WHERE f.followee_id = $1 AND f.status = 'accepted' ORDER BY f.created_at DESC LIMIT 200`, [uid]),
      query(`SELECT ${sel} FROM follows f ${join.replace('%s', 'follower_id')} WHERE f.followee_id = $1 AND f.status = 'pending' ORDER BY f.created_at DESC LIMIT 100`, [uid]),
      query('SELECT COALESCE(is_public, false) AS is_public FROM profiles WHERE user_id = $1', [uid]),
    ]);
    const accepted = following.rows.filter((x) => x.status === 'accepted');
    res.json({
      isPublic: me.rows[0]?.is_public ?? false,
      counts: { followers: followers.rows.length, following: accepted.length, requests: pending.rows.length },
      following: following.rows.map((x) => ({ ...person(x), status: x.status })),
      followers: followers.rows.map(person),
      requests: pending.rows.map((x) => ({ ...person(x), requestedAt: x.created_at })),
    });
  });

  // ---- find people by handle or name (never exposes email)
  r.get('/api/social/search', requireAuth, async (req, res) => {
    searchLimit(req);
    const q = parse(v.object({ q: v.string({ min: 2, max: 40 }) }), req.query, 'query');
    const like = `%${q.q.toLowerCase().replace(/[%_\\]/g, '\\$&')}%`;
    const { rows } = await query(
      `SELECT u.handle, u.display_name, u.avatar_url, COALESCE(p.is_public, false) AS is_public, f.status
         FROM users u LEFT JOIN profiles p ON p.user_id = u.id
         LEFT JOIN follows f ON f.followee_id = u.id AND f.follower_id = $2
        WHERE u.id <> $2 AND (u.handle LIKE $1 OR lower(u.display_name) LIKE $1)
        ORDER BY (u.handle = $3) DESC, u.display_name LIMIT 10`,
      [like, req.user.id, q.q.toLowerCase()],
    );
    res.json({ items: rows.map((x) => ({ ...person(x), followStatus: x.status || null })) });
  });

  // ---- follow / unfollow / cancel request
  r.post('/api/social/follow', ...auth, async (req, res) => {
    writeLimit(req);
    const b = parse(v.object({ handle: handleField }), req.body);
    const target = await userByHandle(b.handle);
    if (target.id === req.user.id) throw errors.validation('You cannot follow yourself');
    const status = target.is_public ? 'accepted' : 'pending';
    await query(
      `INSERT INTO follows (follower_id, followee_id, status) VALUES ($1,$2,$3) ON CONFLICT (follower_id, followee_id) DO NOTHING`,
      [req.user.id, target.id, status],
    );
    const { rows } = await query('SELECT status FROM follows WHERE follower_id = $1 AND followee_id = $2', [req.user.id, target.id]);
    res.json({ handle: target.handle, status: rows[0].status });
  });

  r.delete('/api/social/follow', ...auth, async (req, res) => {
    writeLimit(req);
    const b = parse(v.object({ handle: handleField }), req.body);
    const target = await userByHandle(b.handle);
    await query('DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2', [req.user.id, target.id]);
    res.status(204).end();
  });

  // ---- private profiles: approve / decline a follow request; or remove an existing follower
  r.post('/api/social/requests', ...auth, async (req, res) => {
    writeLimit(req);
    const b = parse(v.object({ handle: handleField, accept: v.bool() }), req.body);
    const other = await userByHandle(b.handle);
    if (b.accept) await query("UPDATE follows SET status = 'accepted' WHERE follower_id = $1 AND followee_id = $2 AND status = 'pending'", [other.id, req.user.id]);
    else await query('DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2', [other.id, req.user.id]);
    res.status(204).end();
  });

  // ---- leaderboard: me + people I follow (accepted only)
  r.get('/api/social/leaderboard', requireAuth, async (req, res) => {
    const q = parse(v.object({ period: v.enum(['week', 'all'], { optional: true }) }), req.query, 'query');
    const period = q.period || 'week';
    const since = period === 'week' ? new Date(Date.now() - 7 * 86400e3).toISOString() : null;
    const { rows: friends } = await query(
      `SELECT u.id, u.handle, u.display_name, u.avatar_url, COALESCE(p.is_public, false) AS is_public
         FROM follows f JOIN users u ON u.id = f.followee_id LEFT JOIN profiles p ON p.user_id = u.id
        WHERE f.follower_id = $1 AND f.status = 'accepted'`,
      [req.user.id],
    );
    const pts = await pointsFor([req.user.id, ...friends.map((f) => f.id)], since);
    const mine = { id: req.user.id, handle: req.user.handle, display_name: req.user.displayName, avatar_url: req.user.avatarUrl, is_public: false };
    const board = [mine, ...friends]
      .map((u) => ({ ...person(u), isMe: u.id === req.user.id, ...pts.get(u.id) }))
      .sort((a, b) => b.points - a.points || a.displayName.localeCompare(b.displayName))
      .map((e, i) => ({ rank: i + 1, ...e }));
    res.json({ period, since, scoring: POINTS, board });
  });

  // ---- follow repositories
  r.get('/api/social/repos', requireAuth, async (req, res) => {
    const { rows } = await query(
      `SELECT rf.repo_id, rf.repo_name, rf.platform, rf.followed_at,
              (SELECT count(*) FROM repo_follows x WHERE x.repo_id = rf.repo_id)::int AS followers
         FROM repo_follows rf WHERE rf.user_id = $1 ORDER BY rf.followed_at DESC LIMIT 200`,
      [req.user.id],
    );
    res.json({ items: rows.map((x) => ({ repoId: x.repo_id, repoName: x.repo_name, platform: x.platform, followedAt: x.followed_at, followers: x.followers })) });
  });

  r.post('/api/social/repos', ...auth, async (req, res) => {
    writeLimit(req);
    const b = parse(v.object({
      repoId: v.string({ min: 3, max: 200 }), repoName: v.string({ min: 1, max: 200 }),
      platform: v.enum(['github', 'gitlab', 'bitbucket'], { optional: true }),
    }), req.body);
    await query(
      `INSERT INTO repo_follows (user_id, repo_id, repo_name, platform) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, repo_id) DO UPDATE SET repo_name = EXCLUDED.repo_name`,
      [req.user.id, b.repoId, b.repoName, b.platform || 'github'],
    );
    res.status(204).end();
  });

  r.delete('/api/social/repos', ...auth, async (req, res) => {
    writeLimit(req);
    const b = parse(v.object({ repoId: v.string({ min: 3, max: 200 }) }), req.body);
    await query('DELETE FROM repo_follows WHERE user_id = $1 AND repo_id = $2', [req.user.id, b.repoId]);
    res.status(204).end();
  });
}

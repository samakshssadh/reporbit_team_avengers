// "Connect GitHub": real GitHub sign-in (OAuth) when configured, otherwise link by public username.
// After connecting, contributions are read from GitHub — users never self-report them.
// The OAuth access token is used once to identify the user and is NOT stored.
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { errors, AppError } from '../lib/errors.js';
import { v, parse } from '../lib/validate.js';
import { requireAuth, requireCsrf } from '../lib/session.js';
import { randomToken, rateLimiter } from '../lib/security.js';
import { getGithubUser, OWNER_RE } from '../services/github.js';
import { syncGithub, contributedRepos } from '../services/githubSync.js';

const auth = [requireAuth, requireCsrf];
const connectLimit = rateLimiter({ windowMs: 10 * 60e3, max: 10, key: (req) => `ghconnect:${req.user.id}` });
const oauthOn = () => !!(config.githubClientId && config.githubClientSecret);
const baseUrl = (req) => config.publicUrl || `http://${req.headers.host}`;

async function linkAccount(userId, login, githubId, verified) {
  const taken = await query('SELECT 1 FROM users WHERE lower(github_login) = lower($1) AND id <> $2', [login, userId]);
  if (taken.rows.length) throw errors.conflict('That GitHub account is already linked to another Reporbit account');
  await query('UPDATE users SET github_login = $1, github_id = $2, github_verified = $3, updated_at = now() WHERE id = $4', [login, githubId, verified, userId]);
}

export function githubRoutes(r) {
  r.get('/api/github/status', requireAuth, async (req, res) => {
    const { rows } = await query('SELECT github_login, github_verified, github_synced_at FROM users WHERE id = $1', [req.user.id]);
    const u = rows[0];
    const { rows: [c] } = await query("SELECT count(*)::int AS n, count(*) FILTER (WHERE kind = 'pull_request' AND status = 'merged')::int AS merged FROM contributions WHERE user_id = $1 AND source = 'github'", [req.user.id]);
    res.json({ connected: !!u.github_login, login: u.github_login, verified: u.github_verified, syncedAt: u.github_synced_at, contributions: c.n, mergedPRs: c.merged, oauthAvailable: oauthOn() });
  });

  // Step 1 of OAuth: send the browser to GitHub.
  r.get('/api/auth/github/start', requireAuth, async (req, res) => {
    if (!oauthOn()) throw new AppError('VALIDATION_ERROR', 'GitHub sign-in is not configured on this server; link by username instead');
    const state = randomToken(24);
    await query("DELETE FROM oauth_states WHERE created_at < now() - interval '15 minutes'");
    await query('INSERT INTO oauth_states (state, user_id) VALUES ($1, $2)', [state, req.user.id]);
    const u = new URL('https://github.com/login/oauth/authorize');
    u.searchParams.set('client_id', config.githubClientId);
    u.searchParams.set('redirect_uri', `${baseUrl(req)}/api/auth/github/callback`);
    u.searchParams.set('state', state);
    u.searchParams.set('allow_signup', 'true');
    res.statusCode = 302; res.setHeader('Location', u.toString()); res.end();
  });

  // Step 2: GitHub sends the user back with ?code&state.
  r.get('/api/auth/github/callback', async (req, res) => {
    const back = (status) => { res.statusCode = 302; res.setHeader('Location', `${baseUrl(req)}/#profile?github=${status}`); res.end(); };
    const { code, state } = req.query;
    if (!req.user || !code || !state || !/^[A-Za-z0-9_-]{20,64}$/.test(state)) return back('error');
    const { rows } = await query("DELETE FROM oauth_states WHERE state = $1 AND user_id = $2 AND created_at > now() - interval '15 minutes' RETURNING 1", [state, req.user.id]);
    if (!rows.length) return back('expired');
    try {
      const tok = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ client_id: config.githubClientId, client_secret: config.githubClientSecret, code: String(code).slice(0, 100), redirect_uri: `${baseUrl(req)}/api/auth/github/callback` }),
      }).then((x) => x.json());
      if (!tok.access_token) return back('denied');
      const me = await fetch(`${config.githubApiUrl}/user`, { headers: { Authorization: `Bearer ${tok.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'reporbit' }, signal: AbortSignal.timeout(8000) }).then((x) => x.json());
      if (!me?.login) return back('error');
      await linkAccount(req.user.id, me.login, me.id, true);
      syncGithub(req.user.id, me.login).catch(() => {}); // runs in background; profile shows progress
      return back('connected');
    } catch (e) {
      return back(e?.code === 'CONFLICT' ? 'taken' : 'error');
    }
  });

  // Fallback when OAuth isn't configured: link by public username (marked as not verified).
  r.post('/api/github/connect', ...auth, async (req, res) => {
    connectLimit(req);
    const b = parse(v.object({ login: v.string({ min: 1, max: 39, pattern: OWNER_RE }) }), req.body);
    let gh;
    try { gh = await getGithubUser(b.login); } catch (e) { if (e.code === 'NOT_FOUND') throw errors.notFound('No GitHub user with that username'); throw e; }
    await linkAccount(req.user.id, gh.login, gh.id, false);
    const out = await syncGithub(req.user.id, gh.login);
    res.json({ connected: true, login: gh.login, verified: false, ...out });
  });

  r.post('/api/github/sync', ...auth, async (req, res) => {
    connectLimit(req);
    const { rows } = await query('SELECT github_login FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0].github_login) throw errors.validation('Connect your GitHub account first');
    res.json(await syncGithub(req.user.id, rows[0].github_login));
  });

  r.delete('/api/github', ...auth, async (req, res) => {
    await query("DELETE FROM contributions WHERE user_id = $1 AND source = 'github'", [req.user.id]);
    await query('UPDATE users SET github_login = NULL, github_id = NULL, github_verified = false, github_synced_at = NULL WHERE id = $1', [req.user.id]);
    await query('UPDATE profiles SET prior_contributions = 0 WHERE user_id = $1', [req.user.id]);
    res.status(204).end();
  });

  // Repos the user has actually contributed to, according to GitHub.
  r.get('/api/me/contributed-repos', requireAuth, async (req, res) => {
    res.json({ items: await contributedRepos(req.user.id) });
  });
}

import { query, tx } from '../db/pool.js';
import { errors, AppError } from '../lib/errors.js';
import { v, parse } from '../lib/validate.js';
import { hashPassword, verifyPassword, dummyVerify, passwordProblem, rateLimiter, clientIp } from '../lib/security.js';
import { createSession, destroySession, requireAuth, requireCsrf, publicUser } from '../lib/session.js';

const authLimit = rateLimiter({ windowMs: 15 * 60e3, max: 20, key: (req) => `auth:${clientIp(req)}` });

const registerSchema = v.object({
  email: v.email(),
  password: v.string({ min: 1, max: 128, trim: false }),
  displayName: v.string({ min: 1, max: 80 }),
  handle: v.string({ min: 2, max: 39, lower: true, pattern: /^[a-z0-9][a-z0-9-]{1,38}$/, optional: true }),
});
const loginSchema = v.object({ email: v.email(), password: v.string({ min: 1, max: 128, trim: false }) });

async function uniqueHandle(client, base) {
  let h = (base || 'dev').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'dev';
  if (h.length < 2) h = `${h}-dev`;
  for (let i = 0; i < 20; i++) {
    const cand = i ? `${h}-${Math.floor(Math.random() * 9000 + 1000)}` : h;
    const { rows } = await client.query('SELECT 1 FROM users WHERE handle = $1', [cand]);
    if (!rows.length) return cand;
  }
  throw new AppError('INTERNAL_ERROR', 'Could not allocate a handle');
}

export function authRoutes(r) {
  r.post('/api/auth/register', async (req, res) => {
    authLimit(req);
    const body = parse(registerSchema, req.body);
    const problem = passwordProblem(body.password, body.email);
    if (problem) throw errors.validation(`password ${problem}`, [{ field: 'password', message: problem }]);
    const hash = await hashPassword(body.password);
    const user = await tx(async (c) => {
      const exists = await c.query('SELECT 1 FROM users WHERE email = $1', [body.email]);
      if (exists.rows.length) throw errors.conflict('An account with this email already exists');
      if (body.handle) {
        const h = await c.query('SELECT 1 FROM users WHERE handle = $1', [body.handle]);
        if (h.rows.length) throw errors.conflict('That handle is taken');
      }
      const handle = body.handle || await uniqueHandle(c, body.email.split('@')[0]);
      const { rows } = await c.query(
        `INSERT INTO users (email, password_hash, display_name, handle, last_login_at) VALUES ($1,$2,$3,$4, now())
         RETURNING id, email, display_name, handle, github_login, avatar_url, created_at`,
        [body.email, hash, body.displayName, handle],
      );
      await c.query('INSERT INTO profiles (user_id) VALUES ($1)', [rows[0].id]);
      return rows[0];
    });
    const csrfToken = await createSession(res, user.id, req.headers['user-agent'] || '');
    res.status(201).json({ user: publicUser(user), csrfToken });
  });

  r.post('/api/auth/login', async (req, res) => {
    authLimit(req);
    const body = parse(loginSchema, req.body);
    const { rows } = await query('SELECT id, email, password_hash, display_name, handle, github_login, avatar_url, created_at FROM users WHERE email = $1', [body.email]);
    const ok = rows.length ? await verifyPassword(body.password, rows[0].password_hash) : await dummyVerify(body.password);
    if (!ok) throw errors.unauth('Email or password is incorrect');
    await query('UPDATE users SET last_login_at = now() WHERE id = $1', [rows[0].id]);
    const csrfToken = await createSession(res, rows[0].id, req.headers['user-agent'] || '');
    res.json({ user: publicUser(rows[0]), csrfToken });
  });

  r.post('/api/auth/logout', async (req, res) => {
    if (req.session) requireCsrf(req);
    await destroySession(req, res);
    res.status(204).end();
  });

  // Frontend calls this on page load to get the CSRF token for an existing session.
  r.get('/api/auth/session', async (req, res) => {
    if (!req.user) return res.json({ authenticated: false, user: null, csrfToken: null });
    res.json({ authenticated: true, user: publicUser(req.user), csrfToken: req.session.csrfToken });
  });

  r.put('/api/auth/password', requireAuth, requireCsrf, async (req, res) => {
    const body = parse(v.object({ currentPassword: v.string({ min: 1, max: 128, trim: false }), newPassword: v.string({ min: 1, max: 128, trim: false }) }), req.body);
    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!(await verifyPassword(body.currentPassword, rows[0].password_hash))) throw errors.unauth('Current password is incorrect');
    const problem = passwordProblem(body.newPassword, req.user.email);
    if (problem) throw errors.validation(`newPassword ${problem}`, [{ field: 'newPassword', message: problem }]);
    await query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [await hashPassword(body.newPassword), req.user.id]);
    // Sign out every other session.
    await query('DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2', [req.user.id, req.session.tokenHash]);
    res.status(204).end();
  });
}

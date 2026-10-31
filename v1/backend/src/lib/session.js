// Server-side sessions in PostgreSQL + double-submit CSRF protection.
// Cookie "sid" (HttpOnly) holds a random token; DB stores only its SHA-256.
// Every state-changing request from a signed-in user must send header X-CSRF-Token.
import { config } from '../config.js';
import { query } from '../db/pool.js';
import { errors, AppError } from './errors.js';
import { randomToken, sha256, safeEqual } from './security.js';

export const COOKIE = 'sid';

export async function createSession(res, userId, userAgent = '') {
  const token = randomToken(32);
  const csrf = randomToken(24);
  const ttl = config.sessionTtlHours * 3600;
  await query(
    `INSERT INTO sessions (token_hash, user_id, csrf_token, user_agent, expires_at) VALUES ($1,$2,$3,$4, now() + make_interval(secs => $5))`,
    [sha256(token), userId, csrf, userAgent.slice(0, 300), ttl],
  );
  res.cookie(COOKIE, token, { httpOnly: true, secure: config.cookieSecure, sameSite: 'Lax', maxAge: ttl });
  return csrf;
}

export async function destroySession(req, res) {
  const token = req.cookies[COOKIE];
  if (token) await query('DELETE FROM sessions WHERE token_hash = $1', [sha256(token)]);
  res.cookie(COOKIE, '', { httpOnly: true, secure: config.cookieSecure, maxAge: 0 });
}

// Middleware: attach req.user / req.session when a valid cookie is present.
export async function loadSession(req) {
  const token = req.cookies[COOKIE];
  if (!token || token.length > 100) return;
  const { rows } = await query(
    `UPDATE sessions s SET last_seen_at = now()
       FROM users u
      WHERE s.token_hash = $1 AND s.expires_at > now() AND u.id = s.user_id
      RETURNING s.csrf_token, u.id, u.email, u.display_name, u.handle, u.github_login, u.avatar_url, u.created_at`,
    [sha256(token)],
  );
  if (!rows.length) return;
  const r = rows[0];
  req.session = { csrfToken: r.csrf_token, tokenHash: sha256(token) };
  req.user = { id: r.id, email: r.email, displayName: r.display_name, handle: r.handle, githubLogin: r.github_login, avatarUrl: r.avatar_url, createdAt: r.created_at };
}

export function requireAuth(req) {
  if (!req.user) throw errors.unauth();
}

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
export function requireCsrf(req) {
  if (!UNSAFE.has(req.method) || !req.session) return;
  const sent = req.headers['x-csrf-token'];
  if (!sent || !safeEqual(sent, req.session.csrfToken)) throw new AppError('CSRF_FAILED', 'Missing or invalid X-CSRF-Token header');
}

export const publicUser = (u) => ({
  id: u.id, email: u.email, displayName: u.displayName ?? u.display_name, handle: u.handle,
  githubLogin: u.githubLogin ?? u.github_login ?? null, avatarUrl: u.avatarUrl ?? u.avatar_url ?? null,
  createdAt: u.createdAt ?? u.created_at,
});

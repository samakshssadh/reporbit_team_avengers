// Password hashing (scrypt, built into Node), random tokens, constant-time compare, rate limiting.
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { errors } from './errors.js';

const scrypt = promisify(crypto.scrypt);
const N = 16384, r = 8, p = 1, KEYLEN = 64;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password.normalize('NFKC'), salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [algo, n, rr, pp, saltB64, keyB64] = stored.split('$');
    if (algo !== 'scrypt') return false;
    const expected = Buffer.from(keyB64, 'base64');
    const key = await scrypt(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, { N: +n, r: +rr, p: +pp });
    return crypto.timingSafeEqual(key, expected);
  } catch { return false; }
}

// Used so login takes the same time whether the email exists or not.
let dummyHash;
export async function dummyVerify(password) {
  dummyHash ||= await hashPassword('dummy-password-for-timing');
  await verifyPassword(password, dummyHash);
  return false;
}

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Weak-password guard: length + not a top common password + not the email.
const COMMON = new Set(['password', 'password1', '12345678', '123456789', 'qwerty123', 'iloveyou', 'admin123', 'letmein1', 'welcome1', '11111111', 'abc12345', 'password123']);
export function passwordProblem(pw, email = '') {
  if (pw.length < 8) return 'must be at least 8 characters';
  if (pw.length > 128) return 'must be at most 128 characters';
  if (COMMON.has(pw.toLowerCase())) return 'is too common';
  if (email && pw.toLowerCase() === email.toLowerCase()) return 'cannot be your email';
  return null;
}

// In-memory fixed-window rate limiter (good enough for a single-process hackathon server).
export function rateLimiter({ windowMs, max, key }) {
  const hits = new Map();
  setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (v.reset < now) hits.delete(k); }, windowMs).unref();
  return (req) => {
    const k = key(req);
    const now = Date.now();
    let e = hits.get(k);
    if (!e || e.reset < now) { e = { count: 0, reset: now + windowMs }; hits.set(k, e); }
    e.count += 1;
    if (e.count > max) throw errors.rateLimited(Math.ceil((e.reset - now) / 1000));
  };
}

export const clientIp = (req) => (req.socket?.remoteAddress || 'unknown');

// Minimal Express-like router on node:http. Supports :params, async handlers, middleware, JSON bodies.
import crypto from 'node:crypto';
import { AppError, toErrorBody, redact } from './errors.js';

const MAX_BODY = 256 * 1024; // 256 KB

export class Router {
  constructor() {
    this.routes = [];
    this.before = [];
  }
  use(fn) { this.before.push(fn); }
  add(method, pattern, ...handlers) {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/\/:([A-Za-z_]+)/g, (_, k) => { keys.push(k); return '/([^/]+)'; }) + '/?$');
    this.routes.push({ method, re, keys, handlers });
  }
  get(p, ...h) { this.add('GET', p, ...h); }
  post(p, ...h) { this.add('POST', p, ...h); }
  put(p, ...h) { this.add('PUT', p, ...h); }
  patch(p, ...h) { this.add('PATCH', p, ...h); }
  delete(p, ...h) { this.add('DELETE', p, ...h); }

  handler() {
    return async (req, res) => {
      const requestId = crypto.randomUUID();
      const started = Date.now();
      res.setHeader('X-Request-Id', requestId);
      enhance(req, res, requestId);
      try {
        for (const fn of this.before) {
          await fn(req, res);
          if (res.writableEnded) return;
        }
        const url = new URL(req.url, 'http://local');
        req.path = url.pathname;
        req.query = Object.fromEntries(url.searchParams);
        let methodMismatch = false;
        for (const r of this.routes) {
          const m = r.re.exec(req.path);
          if (!m) continue;
          if (r.method !== req.method) { methodMismatch = true; continue; }
          req.params = {};
          r.keys.forEach((k, i) => { req.params[k] = decodeURIComponent(m[i + 1]); });
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) req.body = await readJson(req);
          for (const h of r.handlers) {
            await h(req, res);
            if (res.writableEnded) break;
          }
          if (!res.writableEnded) res.status(204).end();
          return;
        }
        throw new AppError(methodMismatch ? 'NOT_FOUND' : 'NOT_FOUND', methodMismatch ? 'Method not allowed on this route' : 'Route not found', { status: methodMismatch ? 405 : 404 });
      } catch (err) {
        const { status, body } = toErrorBody(err, requestId);
        if (status >= 500) console.error(`[${requestId}] ${req.method} ${req.url}:`, redact(err.stack || err.message));
        if (body.error.retryAfterSeconds) res.setHeader('Retry-After', String(body.error.retryAfterSeconds));
        if (!res.headersSent) res.status(status).json(body);
        else res.end();
      } finally {
        if (process.env.NODE_ENV !== 'test') console.log(`${req.method} ${req.url.split('?')[0]} ${res.statusCode} ${Date.now() - started}ms`);
      }
    };
  }
}

function enhance(req, res, requestId) {
  req.id = requestId;
  req.cookies = Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim()).filter(Boolean).map((c) => {
    const i = c.indexOf('=');
    return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))];
  }));
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
  };
  res.cookie = (name, value, opts = {}) => {
    const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${opts.path || '/'}`];
    if (opts.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(opts.maxAge)}`);
    if (opts.httpOnly) parts.push('HttpOnly');
    if (opts.secure) parts.push('Secure');
    parts.push(`SameSite=${opts.sameSite || 'Lax'}`);
    const prev = res.getHeader('Set-Cookie');
    res.setHeader('Set-Cookie', [...(Array.isArray(prev) ? prev : prev ? [prev] : []), parts.join('; ')]);
  };
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new AppError('PAYLOAD_TOO_LARGE', 'Request body too large (max 256 KB)')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      const ct = req.headers['content-type'] || '';
      if (!ct.includes('application/json')) return reject(new AppError('VALIDATION_ERROR', 'Content-Type must be application/json'));
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new AppError('VALIDATION_ERROR', 'Body is not valid JSON')); }
    });
    req.on('error', reject);
  });
}

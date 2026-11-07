import { Router } from './lib/router.js';
import { config } from './config.js';
import { loadSession } from './lib/session.js';
import { authRoutes } from './routes/auth.js';
import { profileRoutes } from './routes/profile.js';
import { issueRoutes } from './routes/issues.js';
import { orbitRoutes } from './routes/orbit.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { githubRoutes } from './routes/github.js';
import { learnRoutes } from './routes/learn.js';
import { socialRoutes } from './routes/social.js';
import { serveStatic } from './lib/static.js';

export function buildApp() {
  const r = new Router();

  // Security headers + CORS (only when CORS_ORIGIN is set; a same-origin dev proxy is preferred).
  r.use((req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (req.url.startsWith('/api')) {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    }
    const origin = req.headers.origin;
    if (origin && config.corsOrigin && config.corsOrigin.split(',').map((s) => s.trim()).includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Expose-Headers', 'X-Request-Id, Retry-After');
    }
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); }
  });
  // Built frontend (public/) is served on the same origin as the API: one server, no CORS.
  r.use(serveStatic);
  r.use(loadSession);

  r.get('/', (req, res) => res.json({ name: 'devpath-backend', docs: '/api/docs', health: '/api/health', note: 'No frontend build found in public/' }));
  r.get('/api/docs', async (req, res) => {
    const { default: fs } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const p = fileURLToPath(new URL('../docs/openapi.json', import.meta.url));
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(fs.readFileSync(p));
  });

  authRoutes(r);
  profileRoutes(r);
  issueRoutes(r);
  orbitRoutes(r);
  dashboardRoutes(r);
  githubRoutes(r);
  learnRoutes(r);
  socialRoutes(r);
  return r.handler();
}

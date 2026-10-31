// Serves the compiled frontend from ./public with SPA fallback to index.html. Never serves outside public/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8', '.map': 'application/json' };

export async function serveStatic(req, res) {
  if (!['GET', 'HEAD'].includes(req.method) || req.url.startsWith('/api')) return;
  const index = path.join(ROOT, 'index.html');
  if (!fs.existsSync(index)) return; // no build -> fall through to API router
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { rel = '/'; }
  let file = path.resolve(ROOT, '.' + rel);
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) file = index;
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = index; // SPA fallback
  const ext = path.extname(file).toLowerCase();
  res.statusCode = 200;
  res.setHeader('Content-Type', TYPES[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache');
  if (req.method === 'HEAD') return res.end();
  await pipeline(fs.createReadStream(file), res);
}

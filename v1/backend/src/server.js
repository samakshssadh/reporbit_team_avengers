import http from 'node:http';
import { config, validateConfig } from './config.js';
import { buildApp } from './app.js';
import { pool, query } from './db/pool.js';
import { gemmaStatus, gemmaInfo } from './services/gemma.js';

try { validateConfig(); } catch (e) { console.error(e.message); process.exit(1); }

const server = http.createServer(buildApp());
server.requestTimeout = 120_000;
server.headersTimeout = 30_000;

server.listen(config.port, async () => {
  console.log(`DevPath backend listening on http://localhost:${config.port}`);
  try { await query('SELECT 1'); console.log('PostgreSQL: ready'); } catch (e) { console.error('PostgreSQL: unavailable —', e.message); }
  const g = gemmaInfo();
  console.log(`Gemma: provider=${g.provider} model=${g.model || '-'} status=${await gemmaStatus({ force: true })}`);
});

// Hourly cleanup of expired sessions and cache rows.
setInterval(() => {
  query('DELETE FROM sessions WHERE expires_at < now()').catch(() => {});
  query("DELETE FROM context_cache WHERE expires_at < now() - interval '1 day'").catch(() => {});
}, 3600e3).unref();

const shutdown = () => { server.close(() => pool.end().then(() => process.exit(0))); setTimeout(() => process.exit(0), 5000).unref(); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

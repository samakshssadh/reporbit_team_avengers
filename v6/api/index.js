import { buildApp } from '../backend/src/app.js';
import { migrate } from '../backend/src/db/migrate.js';
import { pool } from '../backend/src/db/pool.js';

let app;
let ready;

// Create/upgrade the database tables on the first request after each cold start.
// This makes the site self-healing: if the database is wiped or replaced, the tables are rebuilt automatically.
async function ensureSchema() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set in Vercel → Settings → Environment Variables');
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(727274)'); // one migrator at a time
    const { rows } = await client.query("SELECT to_regclass('public.users') AS users, to_regclass('public.schema_migrations') AS log");
    // The users table is gone but other pieces survived (a partial wipe): without users nothing else
    // is usable, so clear the leftovers and rebuild every table from scratch.
    if (!rows[0].users && (await client.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public'")).rows[0].n > 0) {
      console.warn('[migrate] users table missing after a partial wipe: rebuilding the schema');
      await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    }
    await migrate({ log: (m) => console.log('[migrate]', m) });
  } finally {
    await client.query('SELECT pg_advisory_unlock(727274)').catch(() => {});
    client.release();
  }
}

export default async function handler(req, res) {
  try {
    if (!ready) ready = ensureSchema().catch((e) => { ready = null; throw e; });
    await ready;
    if (!app) app = buildApp();
    return await app(req, res);
  } catch (err) {
    console.error('Serverless invocation error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: err.message || 'Server error' } }));
    }
  }
}

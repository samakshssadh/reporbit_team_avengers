// Loads .env (tiny built-in parser, no dotenv dependency) and validates config at startup.
import fs from 'node:fs';
import path from 'node:path';

function loadDotEnv(file = path.resolve(process.cwd(), '.env')) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnv();

const env = process.env;
const int = (v, d) => (v === undefined || v === '' ? d : Number.parseInt(v, 10));

export const config = {
  env: env.NODE_ENV || 'development',
  port: int(env.PORT, 4000),
  databaseUrl: env.DATABASE_URL || '',
  corsOrigin: env.CORS_ORIGIN || '',
  cookieSecure: env.COOKIE_SECURE === 'true',
  sessionTtlHours: Math.max(int(env.SESSION_TTL_HOURS, 720), 720),
  githubToken: env.GITHUB_TOKEN || '',
  // Optional GitHub OAuth app (Settings → Developer settings → OAuth Apps). Without it, users link by username.
  githubClientId: env.GITHUB_CLIENT_ID || '',
  githubClientSecret: env.GITHUB_CLIENT_SECRET || '',
  publicUrl: (env.PUBLIC_URL || '').replace(/\/$/, ''),
  githubApiUrl: (env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, ''),
  gemma: {
    provider: (() => {
      const p = (env.GEMMA_PROVIDER || 'none').trim().toLowerCase();
      if (p === 'auto') {
        const key = (env.GOOGLE_API_KEY || env.GEMINI_API_KEY || '').trim();
        return key ? 'google' : 'none';
      }
      return p;
    })(),
    model: (env.GEMMA_MODEL || (env.GEMMA_PROVIDER === 'google' ? 'gemma-3-27b-it' : '')).trim(),
    ollamaUrl: (env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, ''),
    googleApiKey: (env.GOOGLE_API_KEY || env.GEMINI_API_KEY || '').trim(),
    timeoutMs: int(env.GEMMA_TIMEOUT_MS, 45000),
    googleBaseUrl: (env.GEMMA_GOOGLE_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, ''),
  },
};

export function validateConfig() {
  const problems = [];
  if (!config.databaseUrl) problems.push('DATABASE_URL is required');
  if (!['none', 'ollama', 'google'].includes(config.gemma.provider)) problems.push('GEMMA_PROVIDER must be none | ollama | google');
  if (config.gemma.provider !== 'none' && !config.gemma.model) problems.push('GEMMA_MODEL is required when GEMMA_PROVIDER is set');
  if (config.gemma.provider !== 'none' && !/gemma/i.test(config.gemma.model)) problems.push('GEMMA_MODEL must be a Gemma model id (this product requires Google Gemma)');
  if (config.gemma.provider === 'google' && !config.gemma.googleApiKey) problems.push('GOOGLE_API_KEY (or GEMINI_API_KEY) is required for GEMMA_PROVIDER=google');
  if (problems.length) {
    const err = new Error('Invalid configuration:\n - ' + problems.join('\n - '));
    err.code = 'CONFIG';
    throw err;
  }
}

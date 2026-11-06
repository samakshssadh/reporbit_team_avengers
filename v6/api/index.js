// Vercel serverless entry: every /api/* request is handled by the same Node app the local server uses.
import { buildApp } from '../backend/src/app.js';
import { validateConfig } from '../backend/src/config.js';

let app;
export default function handler(req, res) {
  if (!app) {
    try { validateConfig(); } catch (e) {
      res.statusCode = 500; res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: { code: 'CONFIG', message: e.message } }));
    }
    app = buildApp();
  }
  return app(req, res);
}

// Let the app read the raw request body itself.
export const config = { api: { bodyParser: false } };

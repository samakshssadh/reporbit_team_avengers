import { buildApp } from '../backend/src/app.js';

let app;

export default async function handler(req, res) {
  try {
    if (!app) {
      app = buildApp();
    }
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

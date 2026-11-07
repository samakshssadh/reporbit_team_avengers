import { buildApp } from '../backend/src/app.js';

let app;

export default async function handler(req, res) {
  if (!app) {
    app = buildApp();
  }
  return app(req, res);
}

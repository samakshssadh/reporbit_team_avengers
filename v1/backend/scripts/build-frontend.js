// Builds ../frontend (Vite) and copies its dist/ into ./public so the backend serves it. Cross-platform.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const fe = path.resolve(here, '../../frontend');
const pub = path.resolve(here, '../public');
if (!fs.existsSync(path.join(fe, 'package.json'))) { console.error(`Frontend not found at ${fe}`); process.exit(1); }
const run = (cmd) => execSync(cmd, { cwd: fe, stdio: 'inherit', shell: true });
if (!fs.existsSync(path.join(fe, 'node_modules'))) run('npm install');
run('npm run build');
fs.rmSync(pub, { recursive: true, force: true });
fs.cpSync(path.join(fe, 'dist'), pub, { recursive: true });
console.log(`Frontend built and copied to ${pub}`);

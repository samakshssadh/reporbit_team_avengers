// Vercel build: install + build the React frontend, then apply database migrations.
import { execSync } from 'node:child_process';
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });
run('npm install --no-audit --no-fund', 'frontend');
run('npm run build', 'frontend');
run('npm install --no-audit --no-fund --omit=dev', 'backend');
if (process.env.DATABASE_URL) run('node src/db/migrate.js', 'backend');
else console.warn('DATABASE_URL not set: skipping migrations');

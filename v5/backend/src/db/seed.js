// Seeds curated learning resources (+ optional demo user).
//   npm run seed                 -> resources only (reviewedAt stays null = not verified)
//   npm run seed -- --verify     -> also checks every link over HTTP and sets reviewedAt only for links that respond 2xx/3xx
//   npm run seed -- --demo       -> also creates demo@devpath.dev / DemoPass#2026 with a Python → TypeScript growth story
import { fileURLToPath } from 'node:url';
import { pool, tx } from './pool.js';
import { hashPassword } from '../lib/security.js';

export const RESOURCES = [
  { title: 'Pro Git book (free, official)', topic: 'git', url: 'https://git-scm.com/book/en/v2', kind: 'book' },
  { title: 'Git Branching — Basic Branching and Merging', topic: 'git', url: 'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging', kind: 'guide' },
  { title: 'GitHub Docs: About pull requests', topic: 'open-source', url: 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests', kind: 'docs' },
  { title: 'GitHub Docs: Contributing to a project', topic: 'open-source', url: 'https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project', kind: 'docs' },
  { title: 'Open Source Guides: How to Contribute', topic: 'open-source', url: 'https://opensource.guide/how-to-contribute/', kind: 'guide' },
  { title: 'First Contributions (hands-on practice repo)', topic: 'open-source', url: 'https://github.com/firstcontributions/first-contributions', kind: 'practice' },
  { title: 'The Python Tutorial (official)', topic: 'python', url: 'https://docs.python.org/3/tutorial/', kind: 'docs' },
  { title: 'MDN: JavaScript Guide', topic: 'javascript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', kind: 'docs' },
  { title: 'TypeScript Handbook (official)', topic: 'typescript', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', kind: 'docs' },
  { title: 'Node.js — Learn (official)', topic: 'nodejs', url: 'https://nodejs.org/en/learn', kind: 'docs' },
  { title: 'React — Quick Start (official)', topic: 'react', url: 'https://react.dev/learn', kind: 'docs' },
  { title: 'PostgreSQL Tutorial (official docs)', topic: 'postgresql', url: 'https://www.postgresql.org/docs/current/tutorial.html', kind: 'docs' },
  { title: 'Docker — Get started (official)', topic: 'docker', url: 'https://docs.docker.com/get-started/', kind: 'docs' },
  { title: 'Gemma documentation (Google AI for Developers)', topic: 'llms', url: 'https://ai.google.dev/gemma/docs', kind: 'docs' },
];

async function verify(url) {
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'devpath-seed-link-check' } });
    return r.status < 400;
  } catch { return false; }
}

export async function seedResources({ doVerify = false, log = console.log } = {}) {
  for (const r of RESOURCES) {
    const ok = doVerify ? await verify(r.url) : null;
    await pool.query(
      `INSERT INTO learning_resources (title, topic, url, kind, reviewed_at) VALUES ($1,$2,$3,$4, CASE WHEN $5::boolean THEN now() ELSE NULL END)
       ON CONFLICT (url) DO UPDATE SET title = EXCLUDED.title, topic = EXCLUDED.topic, kind = EXCLUDED.kind,
         reviewed_at = CASE WHEN $5::boolean THEN now() WHEN $6::boolean THEN NULL ELSE learning_resources.reviewed_at END`,
      [r.title, r.topic, r.url, r.kind, ok === true, ok === false],
    );
    if (doVerify) log(`${ok ? 'OK  ' : 'FAIL'} ${r.url}`);
  }
  log(`seeded ${RESOURCES.length} learning resources${doVerify ? ' (verified)' : ' (unverified — run with --verify)'}`);
}

const daysAgo = (n) => new Date(Date.now() - n * 86400e3).toISOString();
const dateAgo = (n) => daysAgo(n).slice(0, 10);

export async function seedDemo({ log = console.log } = {}) {
  const email = 'demo@devpath.dev';
  await pool.query('DELETE FROM users WHERE email = $1', [email]);
  await tx(async (c) => {
    const { rows: [u] } = await c.query(
      `INSERT INTO users (email, password_hash, display_name, handle, created_at) VALUES ($1,$2,'Demo Student','demo-student', $3) RETURNING id`,
      [email, await hashPassword('DemoPass#2026'), daysAgo(400)],
    );
    await c.query(
      `INSERT INTO profiles (user_id, headline, bio, location, experience, interests, goals, links, coding_since, is_public, onboarded)
       VALUES ($1,'CS student · learning full-stack','Started with Python in first year, now building with TypeScript and Node.','Hyderabad, India','intermediate',
       $2,$3,'{}'::jsonb,$4,true,true)`,
      [u.id, ['web development', 'open source', 'ai'], ['Get 5 PRs merged this semester', 'Learn Docker'], dateAgo(420)],
    );
    const skills = [
      ['Python', 'python', 'language', 'learned', 4, 420, 300],
      ['Git', 'git', 'tool', 'learned', 3, 380, 330],
      ['HTML & CSS', 'html-css', 'language', 'learned', 3, 330, 280],
      ['JavaScript', 'javascript', 'language', 'learned', 4, 300, 190],
      ['SQL', 'sql', 'language', 'learned', 3, 250, 170],
      ['Node.js', 'nodejs', 'framework', 'learned', 3, 180, 90],
      ['React', 'react', 'framework', 'learning', 3, 150, null],
      ['TypeScript', 'typescript', 'language', 'learning', 3, 100, null],
      ['PostgreSQL', 'postgresql', 'database', 'learning', 2, 60, null],
      ['Express', 'express', 'framework', 'learning', 2, 40, null],
    ];
    for (const [name, slug, category, status, prof, start, learned] of skills) {
      const { rows: [s] } = await c.query(
        `INSERT INTO skills (user_id, name, slug, category, status, proficiency, started_at, learned_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [u.id, name, slug, category, status, prof, dateAgo(start), learned ? dateAgo(learned) : null],
      );
      await c.query(`INSERT INTO skill_events (user_id, skill_id, skill_name, event_type, to_level, occurred_at) VALUES ($1,$2,$3,'started',1,$4)`, [u.id, s.id, name, daysAgo(start)]);
      if (prof > 1) await c.query(`INSERT INTO skill_events (user_id, skill_id, skill_name, event_type, from_level, to_level, occurred_at) VALUES ($1,$2,$3,'level_up',1,$4,$5)`, [u.id, s.id, name, prof, daysAgo(Math.round((start + (learned ?? 0)) / 2))]);
      if (learned) await c.query(`INSERT INTO skill_events (user_id, skill_id, skill_name, event_type, to_level, occurred_at) VALUES ($1,$2,$3,'learned',$4,$5)`, [u.id, s.id, name, prof, daysAgo(learned)]);
    }
    // NOTE: demo contributions use example repo names and no URLs — they are fixtures, clearly fake.
    const contribs = [
      ['issue', 'Reported typo in installation guide', 'example-org/py-utils', 'completed', ['python'], 320],
      ['docs', 'Fixed broken links in README', 'example-org/py-utils', 'completed', ['python'], 300],
      ['pull_request', 'Add type hints to helpers module', 'example-org/py-utils', 'merged', ['python'], 270],
      ['commit', 'Personal project: CLI todo app', 'demo-student/todo-cli', 'completed', ['python', 'git'], 260],
      ['pull_request', 'Improve mobile layout of landing page', 'example-org/web-starter', 'merged', ['html-css'], 220],
      ['review', 'Reviewed CSS refactor PR', 'example-org/web-starter', 'completed', ['html-css'], 200],
      ['pull_request', 'Add dark mode toggle', 'example-org/web-starter', 'closed', ['javascript'], 180],
      ['pull_request', 'Fix date parsing bug', 'example-org/js-dates', 'merged', ['javascript'], 150],
      ['docs', 'Document environment variables', 'example-org/api-kit', 'completed', ['nodejs'], 120],
      ['pull_request', 'Add pagination to /users endpoint', 'example-org/api-kit', 'merged', ['nodejs', 'sql'], 95],
      ['issue', 'Proposed TypeScript migration plan', 'example-org/api-kit', 'completed', ['typescript'], 70],
      ['pull_request', 'Convert utils to TypeScript', 'example-org/api-kit', 'merged', ['typescript'], 45],
      ['pull_request', 'Add React hook for API errors', 'example-org/ui-kit', 'open', ['react', 'typescript'], 20],
      ['review', 'Reviewed Postgres migration PR', 'example-org/api-kit', 'completed', ['postgresql'], 12],
      ['pull_request', 'Add health check endpoint', 'example-org/api-kit', 'open', ['express', 'nodejs'], 5],
    ];
    for (const [kind, title, repo, status, sk, ago] of contribs) {
      const [o, n] = repo.split('/');
      await c.query(`INSERT INTO contributions (user_id, kind, title, repo_owner, repo_name, status, skills, occurred_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [u.id, kind, title, o, n, status, sk, daysAgo(ago)]);
    }
  });
  log('demo user: demo@devpath.dev / DemoPass#2026 (public handle: demo-student)');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  (async () => {
    await seedResources({ doVerify: args.includes('--verify') });
    if (args.includes('--demo')) await seedDemo();
    await pool.end();
  })().catch((e) => { console.error(e.message); process.exit(1); });
}

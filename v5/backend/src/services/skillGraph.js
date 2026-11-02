// Knowledge graph of skills: normalisation, categories, GitHub language mapping,
// "what this skill unlocks next" edges, and keywords used to spot prerequisites in issues.
// Deterministic and editable — extend CATALOG to teach the system new skills.

export const CATALOG = [
  // ---- languages
  { slug: 'python', name: 'Python', category: 'language', gh: 'Python', aliases: ['py', 'python3'], next: ['fastapi', 'django', 'flask', 'pandas', 'pytest'] },
  { slug: 'javascript', name: 'JavaScript', category: 'language', gh: 'JavaScript', aliases: ['js', 'ecmascript', 'es6'], next: ['typescript', 'nodejs', 'react', 'html-css'] },
  { slug: 'typescript', name: 'TypeScript', category: 'language', gh: 'TypeScript', aliases: ['ts'], next: ['react', 'nextjs', 'nestjs', 'nodejs'] },
  { slug: 'java', name: 'Java', category: 'language', gh: 'Java', aliases: [], next: ['spring', 'kotlin'] },
  { slug: 'kotlin', name: 'Kotlin', category: 'language', gh: 'Kotlin', aliases: [], next: ['android'] },
  { slug: 'c', name: 'C', category: 'language', gh: 'C', aliases: [], next: ['cpp', 'rust', 'linux'] },
  { slug: 'cpp', name: 'C++', category: 'language', gh: 'C++', aliases: ['c++', 'cplusplus'], next: ['rust', 'cmake'] },
  { slug: 'csharp', name: 'C#', category: 'language', gh: 'C#', aliases: ['c#', 'dotnet', '.net'], next: [] },
  { slug: 'go', name: 'Go', category: 'language', gh: 'Go', aliases: ['golang'], next: ['docker', 'kubernetes'] },
  { slug: 'rust', name: 'Rust', category: 'language', gh: 'Rust', aliases: ['rustlang'], next: ['wasm'] },
  { slug: 'ruby', name: 'Ruby', category: 'language', gh: 'Ruby', aliases: [], next: ['rails'] },
  { slug: 'php', name: 'PHP', category: 'language', gh: 'PHP', aliases: [], next: ['laravel'] },
  { slug: 'swift', name: 'Swift', category: 'language', gh: 'Swift', aliases: [], next: [] },
  { slug: 'dart', name: 'Dart', category: 'language', gh: 'Dart', aliases: [], next: ['flutter'] },
  { slug: 'html-css', name: 'HTML & CSS', category: 'language', gh: 'HTML', aliases: ['html', 'css', 'html5', 'css3'], next: ['javascript', 'tailwind'] },
  { slug: 'shell', name: 'Shell / Bash', category: 'language', gh: 'Shell', aliases: ['bash', 'sh', 'zsh'], next: ['linux', 'docker'] },
  { slug: 'sql', name: 'SQL', category: 'language', gh: null, aliases: [], next: ['postgresql'] },
  // ---- frameworks / libraries
  { slug: 'nodejs', name: 'Node.js', category: 'framework', gh: 'JavaScript', aliases: ['node', 'node.js'], next: ['express', 'nestjs', 'postgresql'] },
  { slug: 'express', name: 'Express', category: 'framework', gh: 'JavaScript', aliases: ['expressjs'], next: ['postgresql', 'docker'] },
  { slug: 'nestjs', name: 'NestJS', category: 'framework', gh: 'TypeScript', aliases: ['nest'], next: [] },
  { slug: 'react', name: 'React', category: 'framework', gh: 'JavaScript', aliases: ['reactjs', 'react.js'], next: ['nextjs', 'react-native', 'tailwind'] },
  { slug: 'nextjs', name: 'Next.js', category: 'framework', gh: 'TypeScript', aliases: ['next', 'next.js'], next: [] },
  { slug: 'react-native', name: 'React Native', category: 'framework', gh: 'TypeScript', aliases: [], next: [] },
  { slug: 'vue', name: 'Vue', category: 'framework', gh: 'Vue', aliases: ['vuejs', 'vue.js'], next: [] },
  { slug: 'tailwind', name: 'Tailwind CSS', category: 'library', gh: 'CSS', aliases: ['tailwindcss'], next: [] },
  { slug: 'django', name: 'Django', category: 'framework', gh: 'Python', aliases: [], next: ['postgresql', 'docker'] },
  { slug: 'flask', name: 'Flask', category: 'framework', gh: 'Python', aliases: [], next: ['docker'] },
  { slug: 'fastapi', name: 'FastAPI', category: 'framework', gh: 'Python', aliases: [], next: ['docker', 'postgresql'] },
  { slug: 'pandas', name: 'pandas', category: 'library', gh: 'Python', aliases: [], next: ['numpy', 'machine-learning'] },
  { slug: 'numpy', name: 'NumPy', category: 'library', gh: 'Python', aliases: [], next: ['machine-learning'] },
  { slug: 'pytest', name: 'pytest', category: 'tool', gh: 'Python', aliases: [], next: [] },
  { slug: 'machine-learning', name: 'Machine Learning', category: 'concept', gh: 'Jupyter Notebook', aliases: ['ml'], next: ['pytorch', 'llms'] },
  { slug: 'pytorch', name: 'PyTorch', category: 'library', gh: 'Python', aliases: ['torch'], next: ['llms'] },
  { slug: 'llms', name: 'LLMs / Gemma', category: 'concept', gh: 'Python', aliases: ['llm', 'gemma', 'ai'], next: [] },
  { slug: 'spring', name: 'Spring Boot', category: 'framework', gh: 'Java', aliases: ['spring-boot', 'springboot'], next: ['docker'] },
  { slug: 'android', name: 'Android', category: 'framework', gh: 'Kotlin', aliases: [], next: [] },
  { slug: 'flutter', name: 'Flutter', category: 'framework', gh: 'Dart', aliases: [], next: [] },
  { slug: 'rails', name: 'Ruby on Rails', category: 'framework', gh: 'Ruby', aliases: ['ror'], next: [] },
  { slug: 'laravel', name: 'Laravel', category: 'framework', gh: 'PHP', aliases: [], next: [] },
  { slug: 'wasm', name: 'WebAssembly', category: 'concept', gh: 'Rust', aliases: ['webassembly'], next: [] },
  // ---- tools / db / cloud / concepts
  { slug: 'git', name: 'Git', category: 'tool', gh: null, aliases: ['github'], next: ['open-source', 'github-actions'] },
  { slug: 'open-source', name: 'Open-source workflow', category: 'concept', gh: null, aliases: ['oss', 'pull requests'], next: [] },
  { slug: 'github-actions', name: 'GitHub Actions', category: 'tool', gh: null, aliases: ['ci', 'ci/cd'], next: ['docker'] },
  { slug: 'docker', name: 'Docker', category: 'tool', gh: 'Dockerfile', aliases: ['containers'], next: ['kubernetes'] },
  { slug: 'kubernetes', name: 'Kubernetes', category: 'cloud', gh: null, aliases: ['k8s'], next: [] },
  { slug: 'linux', name: 'Linux', category: 'tool', gh: null, aliases: [], next: ['shell', 'docker'] },
  { slug: 'cmake', name: 'CMake', category: 'tool', gh: 'CMake', aliases: [], next: [] },
  { slug: 'postgresql', name: 'PostgreSQL', category: 'database', gh: null, aliases: ['postgres', 'psql'], next: [] },
  { slug: 'mongodb', name: 'MongoDB', category: 'database', gh: null, aliases: ['mongo'], next: [] },
  { slug: 'aws', name: 'AWS', category: 'cloud', gh: null, aliases: ['amazon web services'], next: ['docker'] },
  { slug: 'testing', name: 'Testing', category: 'concept', gh: null, aliases: ['unit tests', 'jest', 'vitest'], next: ['github-actions'] },
  { slug: 'dsa', name: 'Data Structures & Algorithms', category: 'concept', gh: null, aliases: ['data structures', 'algorithms'], next: [] },
];

const BY_SLUG = new Map(CATALOG.map((s) => [s.slug, s]));
const LOOKUP = new Map();
for (const s of CATALOG) {
  for (const k of [s.slug, s.name, ...s.aliases]) LOOKUP.set(k.toLowerCase(), s);
}

export function slugify(name) {
  return String(name).toLowerCase().trim().replace(/\+\+/g, 'pp').replace(/#/g, 'sharp').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'skill';
}

// Normalise user input ("JS", "node.js", "Python3") to a canonical skill.
export function resolveSkill(input) {
  const key = String(input).toLowerCase().trim();
  const hit = LOOKUP.get(key) || LOOKUP.get(key.replace(/\s+/g, ''));
  if (hit) return { slug: hit.slug, name: hit.name, category: hit.category, known: true };
  return { slug: slugify(input), name: String(input).trim(), category: 'other', known: false };
}

export const skillInfo = (slug) => BY_SLUG.get(slug) || null;

// GitHub "language" name -> skill slug (for syncing contributions and matching issues).
export function skillForGithubLanguage(lang) {
  if (!lang) return null;
  const s = CATALOG.find((c) => c.category === 'language' && c.gh && c.gh.toLowerCase() === lang.toLowerCase());
  return s ? s.slug : resolveSkill(lang).slug;
}

// Languages GitHub search understands for a set of user skills (framework -> its language).
export function githubLanguagesFor(slugs) {
  const out = new Set();
  for (const slug of slugs) {
    const s = BY_SLUG.get(slug);
    if (s?.gh && !['Dockerfile', 'CMake', 'Jupyter Notebook'].includes(s.gh)) out.add(s.gh);
  }
  return [...out];
}

// Skills that are mentioned in free text (issue title/body/labels). Word-boundary matching only.
export function skillsMentioned(text) {
  const t = ` ${String(text || '').toLowerCase()} `;
  const found = new Set();
  for (const s of CATALOG) {
    for (const term of [s.name, ...s.aliases, s.slug]) {
      const k = term.toLowerCase();
      if (k.length < 2 || ['c', 'go', 'ai', 'ml', 'ci', 'sh', 'next', 'node', 'nest', 'torch', 'github'].includes(k)) continue; // too ambiguous
      const re = new RegExp(`(^|[^a-z0-9+#.])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9+#]|$)`);
      if (re.test(t)) { found.add(s.slug); break; }
    }
  }
  return [...found];
}

// Recommend next skills: walk outgoing edges from what the user knows, score each candidate.
//  score = 3 * (#known skills that unlock it) + 2 * (matches an interest) + 1 * (proficiency of best parent >= 3)
export function recommendNextSkills(userSkills, interests = [], limit = 5) {
  const have = new Set(userSkills.map((s) => s.slug));
  const interestText = interests.join(' ').toLowerCase();
  const cand = new Map();
  for (const us of userSkills) {
    const info = BY_SLUG.get(us.slug);
    if (!info || us.status === 'paused') continue;
    for (const nxt of info.next) {
      if (have.has(nxt)) continue;
      const c = cand.get(nxt) || { slug: nxt, unlockedBy: [], score: 0, readyParent: false };
      c.unlockedBy.push(info.name);
      if (us.proficiency >= 3 || us.status === 'learned') c.readyParent = true;
      cand.set(nxt, c);
    }
  }
  const out = [];
  for (const c of cand.values()) {
    const info = BY_SLUG.get(c.slug);
    if (!info) continue;
    const interestHit = interestText && [info.name, ...info.aliases].some((a) => interestText.includes(a.toLowerCase()));
    const score = 3 * c.unlockedBy.length + (interestHit ? 2 : 0) + (c.readyParent ? 1 : 0);
    const reasons = [`Builds on ${c.unlockedBy.join(', ')}`];
    if (interestHit) reasons.push('Matches one of your interests');
    if (c.readyParent) reasons.push('You are already confident in a prerequisite');
    out.push({ slug: c.slug, name: info.name, category: info.category, score, reasons });
  }
  return out.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, limit);
}

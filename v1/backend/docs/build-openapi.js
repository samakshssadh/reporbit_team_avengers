// Generates docs/openapi.json (served at GET /api/docs). Run: node docs/build-openapi.js
import fs from 'node:fs';

const ref = (n) => ({ $ref: `#/components/schemas/${n}` });
const json = (schema) => ({ content: { 'application/json': { schema } } });
const ok = (schema, d = 'OK') => ({ description: d, ...json(schema) });
const err = { description: 'Error', ...json(ref('Error')) };
const csrf = { name: 'X-CSRF-Token', in: 'header', required: true, schema: { type: 'string' }, description: 'Token from login/register/GET /api/auth/session' };
const S = (type, extra = {}) => ({ type, ...extra });
const arr = (items) => ({ type: 'array', items });
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required });
const str = S('string'); const num = S('integer'); const bool = S('boolean');
const nullable = (s) => ({ ...s, nullable: true });

const schemas = {
  Error: obj({ error: obj({ code: S('string', { enum: ['UNAUTHENTICATED', 'CSRF_FAILED', 'VALIDATION_ERROR', 'NOT_FOUND', 'CONFLICT', 'PAYLOAD_TOO_LARGE', 'RATE_LIMITED', 'INTERNAL_ERROR', 'UPSTREAM_ERROR', 'MODEL_UNAVAILABLE', 'UPSTREAM_TIMEOUT'] }), message: str, retryable: bool, requestId: str, retryAfterSeconds: num, details: arr(obj({ field: str, message: str })) }, ['code', 'message', 'retryable', 'requestId']) }),
  User: obj({ id: str, email: str, displayName: str, handle: str, githubLogin: nullable(str), avatarUrl: nullable(str), createdAt: str }),
  Profile: obj({ skills: arr(str), interests: arr(str), experience: S('string', { enum: ['beginner', 'intermediate', 'advanced'] }), headline: nullable(str), bio: nullable(str), location: nullable(str), goals: arr(str), links: S('object'), codingSince: nullable(str), isPublic: bool, onboarded: bool, updatedAt: str }),
  Skill: obj({ id: str, name: str, slug: str, category: S('string', { enum: ['language', 'framework', 'library', 'tool', 'database', 'cloud', 'concept', 'other'] }), status: S('string', { enum: ['learning', 'learned', 'paused'] }), proficiency: S('integer', { minimum: 1, maximum: 5 }), startedAt: str, learnedAt: nullable(str), notes: nullable(str), updatedAt: str }),
  Contribution: obj({ id: str, kind: S('string', { enum: ['pull_request', 'issue', 'commit', 'review', 'docs', 'discussion', 'other'] }), title: str, description: nullable(str), repo: nullable(obj({ owner: str, name: str, fullName: str })), url: nullable(str), status: S('string', { enum: ['open', 'merged', 'closed', 'draft', 'completed'] }), skills: arr(str), skillSlugs: arr(str), occurredAt: str, source: S('string', { enum: ['manual', 'github'] }), createdAt: str }),
  Source: obj({ id: str, title: str, url: str }),
  Document: obj({ kind: S('string', { enum: ['readme', 'contributing', 'community'] }), content: str, sourceId: str, truncated: bool }),
  ChecklistItem: obj({ id: str, text: str, kind: S('string', { enum: ['documented', 'suggested'] }), sourceIds: arr(str) }),
  LearningResource: obj({ id: str, title: str, topic: str, url: str, kind: str, reviewedAt: nullable(str) }),
  Issue: obj({ id: str, owner: str, repo: str, number: num, title: str, url: str, body: nullable(str), labels: arr(str), languages: arr(str), state: S('string', { enum: ['open', 'closed'] }), assignees: arr(str), updatedAt: str, checkedAt: str, freshness: S('string', { enum: ['live', 'cached'] }), matchedSkills: arr(str), prerequisiteGaps: arr(str), fitReasons: arr(str), difficulty: obj({ level: S('string', { enum: ['beginner', 'intermediate', 'advanced', 'unknown'] }), rationale: str }), uncertainty: arr(str), firstStep: nullable(obj({ text: str, sourceIds: arr(str) })), sources: arr(ref('Source')), ranking: obj({ score: num, breakdown: S('object') }), comments: num }),
  Growth: { type: 'object', description: 'See docs/samples/me-growth.json for the full shape', properties: { level: S('object'), totals: S('object'), streaks: S('object'), momentum: S('object'), mastery: arr(S('object')), evolution: S('object'), monthly: arr(S('object')), heatmap: arr(obj({ date: str, count: num })), journey: arr(obj({ date: str, type: str, title: str, detail: nullable(str) })), topRepositories: arr(S('object')), categories: S('object'), badges: arr(obj({ id: str, name: str, description: str, earned: bool })), nextSkills: arr(S('object')), insights: arr(str), rules: S('object') } },
  ModelInfo: obj({ provider: S('string', { enum: ['ollama', 'google'] }), id: str, latencyMs: num }),
};

const p = {};
const route = (method, path, op) => { p[path] ||= {}; p[path][method] = { responses: { default: err, ...op.responses }, ...op }; };
const authed = (op, write) => ({ security: [{ session: [] }], ...(write ? { parameters: [...(op.parameters || []), csrf] } : {}), ...op });

route('post', '/api/auth/register', { tags: ['auth'], summary: 'Create account (email + password). Sets HttpOnly session cookie.', requestBody: json(obj({ email: str, password: S('string', { minLength: 8, maxLength: 128 }), displayName: str, handle: str }, ['email', 'password', 'displayName'])), responses: { 201: ok(obj({ user: ref('User'), csrfToken: str })) } });
route('post', '/api/auth/login', { tags: ['auth'], summary: 'Sign in. Sets session cookie, returns CSRF token.', requestBody: json(obj({ email: str, password: str })), responses: { 200: ok(obj({ user: ref('User'), csrfToken: str })) } });
route('post', '/api/auth/logout', { tags: ['auth'], summary: 'Sign out (204). Send X-CSRF-Token if signed in.', responses: { 204: { description: 'Signed out' } } });
route('get', '/api/auth/session', { tags: ['auth'], summary: 'Current session + CSRF token (call on app load)', responses: { 200: ok(obj({ authenticated: bool, user: nullable(ref('User')), csrfToken: nullable(str) })) } });
route('put', '/api/auth/password', authed({ tags: ['auth'], summary: 'Change password; signs out other sessions', requestBody: json(obj({ currentPassword: str, newPassword: str })), responses: { 204: { description: 'Changed' } } }, true));
route('get', '/api/me', authed({ tags: ['profile'], summary: 'Contract v1: user + profile + suggestedSkills', responses: { 200: ok(obj({ user: ref('User'), profile: nullable(ref('Profile')), suggestedSkills: arr(str) })) } }));
route('put', '/api/me/profile', authed({ tags: ['profile'], summary: 'Partial update. `skills` (if sent) is the confirmed list: adds new, removes unticked.', requestBody: json({ type: 'object', properties: { skills: arr(str), interests: arr(str), experience: str, headline: str, bio: str, location: str, goals: arr(str), links: S('object'), codingSince: str, isPublic: bool, displayName: str, githubLogin: str, onboarded: bool } }), responses: { 200: ok(obj({ profile: ref('Profile') })) } }, true));
route('delete', '/api/me', authed({ tags: ['profile'], summary: 'Delete account and all data', responses: { 204: { description: 'Deleted' } } }, true));
route('get', '/api/me/skills', authed({ tags: ['skills'], responses: { 200: ok(obj({ items: arr(ref('Skill')) })) } }));
route('post', '/api/me/skills', authed({ tags: ['skills'], summary: 'Add a skill (aliases normalised: "JS" → JavaScript). 409 if duplicate.', requestBody: json(obj({ name: str, category: str, status: str, proficiency: num, startedAt: str, learnedAt: str, notes: str }, ['name'])), responses: { 201: ok(obj({ skill: ref('Skill') })) } }, true));
route('post', '/api/me/skills/bulk', authed({ tags: ['skills'], summary: 'Add many (onboarding / confirmed Gemma suggestions)', requestBody: json(obj({ skills: arr(S('object')) })), responses: { 201: ok(obj({ created: arr(ref('Skill')), skipped: arr(str) })) } }, true));
route('patch', '/api/me/skills/{id}', authed({ tags: ['skills'], summary: 'Update; writes level_up / learned / paused events to the growth log', requestBody: json({ type: 'object', properties: { category: str, status: str, proficiency: num, startedAt: str, learnedAt: nullable(str), notes: str, note: str } }), responses: { 200: ok(obj({ skill: ref('Skill') })) } }, true));
route('delete', '/api/me/skills/{id}', authed({ tags: ['skills'], responses: { 204: { description: 'Deleted' } } }, true));
route('get', '/api/me/skills/{id}/history', authed({ tags: ['skills'], summary: 'Growth log for one skill', responses: { 200: ok(obj({ items: arr(obj({ type: str, fromLevel: nullable(num), toLevel: nullable(num), note: nullable(str), occurredAt: str })) })) } }));
route('post', '/api/me/skills/extract', authed({ tags: ['gemma'], summary: 'GEMMA: read free text and suggest skills (not saved — confirm via /bulk)', requestBody: json(obj({ text: str })), responses: { 200: ok(obj({ suggestions: arr(obj({ name: str, slug: str, category: str, status: str, proficiency: num, evidence: str, alreadyAdded: bool })), model: ref('ModelInfo'), note: str })) } }, true));
route('get', '/api/me/contributions', authed({ tags: ['contributions'], summary: 'Newest first. Query: kind, status, skill, limit (1–100, default 20), cursor', responses: { 200: ok(obj({ items: arr(ref('Contribution')), nextCursor: nullable(str), total: num })) } }));
route('post', '/api/me/contributions', authed({ tags: ['contributions'], requestBody: json(obj({ kind: str, title: str, description: str, repo: S('string', { example: 'owner/name' }), url: str, status: str, skills: arr(str), occurredAt: str }, ['kind', 'title'])), responses: { 201: ok(obj({ contribution: ref('Contribution') })) } }, true));
route('patch', '/api/me/contributions/{id}', authed({ tags: ['contributions'], responses: { 200: ok(obj({ contribution: ref('Contribution') })) } }, true));
route('delete', '/api/me/contributions/{id}', authed({ tags: ['contributions'], responses: { 204: { description: 'Deleted' } } }, true));
route('post', '/api/me/contributions/sync-github', authed({ tags: ['contributions'], summary: 'Import public PRs/issues of the linked githubLogin (idempotent)', responses: { 200: ok(obj({ githubLogin: str, fetched: num, inserted: num, updated: num, note: str })) } }, true));
route('get', '/api/me/growth', authed({ tags: ['growth'], summary: 'Full growth dashboard (deterministic)', responses: { 200: ok(ref('Growth')) } }));
route('post', '/api/me/growth/story', authed({ tags: ['gemma'], summary: 'GEMMA: narrate the growth data (facts only)', responses: { 200: ok(obj({ title: str, story: str, nextFocus: str, basedOn: S('object'), model: ref('ModelInfo') })) } }, true));
route('get', '/api/u/{handle}', { tags: ['growth'], summary: 'Public profile (only if isPublic). Never includes email.', responses: { 200: ok(S('object')) } });
route('get', '/api/issues', authed({ tags: ['issues'], summary: 'Contract v1. Query: skills (comma list, default = profile), limit 1–25 (default 10), cursor, includeAssigned=false. Excludes PRs, closed and (by default) assigned issues.', responses: { 200: ok(obj({ items: arr(ref('Issue')), nextCursor: nullable(str), checkedAt: str, searchedLanguages: arr(str) })) } }));
route('get', '/api/issues/{owner}/{repo}/{number}', authed({ tags: ['issues'], summary: 'Contract v1. Live state recheck + README/CONTRIBUTING/community docs with source ids', responses: { 200: ok(obj({ issue: ref('Issue'), documents: arr(ref('Document')), sources: arr(ref('Source')), missingContext: arr(str), checklist: arr(ref('ChecklistItem')), repository: nullable(S('object')) })) } }));
route('post', '/api/mentor/chat', authed({ tags: ['gemma'], summary: 'Contract v1. GEMMA mentor grounded in server-fetched repo docs. message ≤2000 chars; last 10 history items used (≤2000 chars each).', requestBody: json(obj({ message: str, history: arr(obj({ role: S('string', { enum: ['user', 'assistant'] }), content: str })), issue: nullable(obj({ owner: str, repo: str, number: num })) }, ['message'])), responses: { 200: ok(obj({ answer: str, sources: arr(ref('Source')), caveats: arr(str), model: ref('ModelInfo') })) } }, true));
route('get', '/api/resources', { tags: ['resources'], summary: 'Contract v1. Curated links; ?topic=git|open-source|python|...', responses: { 200: ok(obj({ items: arr(ref('LearningResource')) })) } });
route('get', '/api/health', { tags: ['health'], summary: 'Contract v1. No inference is run; Gemma readiness cached 60s.', responses: { 200: ok(obj({ status: S('string', { enum: ['ok', 'degraded'] }), dependencies: obj({ database: str, github: str, gemma: str }) })) } });

route('get', '/api/repositories', { tags: ['orbit'], summary: 'ORBIT UI: recommended repositories from real GitHub good-first-issues. Query: skills (comma list), experience, limit <=12. Login optional.', responses: { 200: ok(obj({ data: arr(S('object', { description: 'Orbit Repository (see frontend src/types)' })), checkedAt: str, basedOn: S('object') })) } });
route('get', '/api/repositories/{id}/roadmap', { tags: ['orbit', 'gemma'], summary: 'ORBIT UI: contribution roadmap. id = owner__repo. GEMMA writes it from README/CONTRIBUTING; invented files/commands are stripped. generatedBy: gemma | rules (honest fallback).', responses: { 200: ok(S('object')) } });
route('post', '/api/chat', { tags: ['orbit', 'gemma'], summary: 'ORBIT UI: chat. {messages:[{role,content}], repoContext?:{id,name,owner}} -> {response, model, sources, caveats}. If Gemma is down returns 200 with an explicit non-AI notice + error.code.', responses: { 200: ok(obj({ response: str, model: str, sources: arr(ref('Source')), caveats: arr(str) }, ['response', 'model'])) } });

const doc = { openapi: '3.0.3', info: { title: 'DevPath backend API (contract v1 + growth extensions)', version: '1.0.0' }, servers: [{ url: 'http://localhost:4000' }], components: { securitySchemes: { session: { type: 'apiKey', in: 'cookie', name: 'sid' } }, schemas }, paths: p };
fs.writeFileSync(new URL('./openapi.json', import.meta.url), JSON.stringify(doc, null, 2) + '\n');
console.log(`wrote openapi.json with ${Object.keys(p).length} paths`);

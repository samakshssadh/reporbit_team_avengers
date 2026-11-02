# Frontend handoff (for Antigravity)

**Base URL:** `http://localhost:4000`. The recommended setup is a same-origin dev proxy so that cookies just work.

Vite (`vite.config.ts`):
```ts
server: { proxy: { '/api': 'http://localhost:4000' } }
```
Without a proxy, set `CORS_ORIGIN=http://localhost:5173` in the backend `.env` and use `credentials: 'include'`.

## Session flow
1. On app load, call `GET /api/auth/session` to get `{authenticated, user, csrfToken}`. Keep `csrfToken` in memory.
2. Register with `POST /api/auth/register {email, password, displayName}`, or sign in with `POST /api/auth/login {email, password}`. Both return `{user, csrfToken}` and set the HttpOnly `sid` cookie. **The cookie can't be read from JS, and that's intended.**
3. Every POST/PUT/PATCH/DELETE must include the header `X-CSRF-Token: <csrfToken>`, or you'll get a 403 `CSRF_FAILED`.
4. Sign out with `POST /api/auth/logout`, which returns 204.

```ts
async function api(path: string, init: RequestInit = {}) {
  const r = await fetch(path, {
    ...init, credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...init.headers },
  });
  if (r.status === 204) return null;
  const body = await r.json();
  if (!r.ok) throw body.error; // {code, message, retryable, requestId, retryAfterSeconds?, details?}
  return body;
}
```

## Errors
Every error has the shape `{"error":{"code","message","retryable","requestId"}}`, optionally with `retryAfterSeconds` (also sent as the `Retry-After` header) and `details: [{field, message}]` for form errors.

| code | HTTP | UI suggestion |
|---|---|---|
| UNAUTHENTICATED | 401 | redirect to login |
| CSRF_FAILED | 403 | re-fetch `/api/auth/session`, retry once |
| VALIDATION_ERROR | 400 | show `details[].message` next to the matching `field` |
| NOT_FOUND | 404 | |
| CONFLICT | 409 | e.g. "email already registered", "skill already added" |
| RATE_LIMITED | 429 | wait `retryAfterSeconds` |
| MODEL_UNAVAILABLE | 503 | "Gemma mentor is offline", without breaking the page |
| UPSTREAM_TIMEOUT | 504 | "Took too long, try again" |

## Screens → endpoints
| Screen | Endpoints |
|---|---|
| Sign up / login | `/api/auth/register`, `/api/auth/login`, `/api/auth/session` |
| Onboarding | Paste an "about me" into `POST /api/me/skills/extract` (Gemma suggestions, which the user ticks) → `POST /api/me/skills/bulk`. Then `PUT /api/me/profile {interests, experience, githubLogin, codingSince, headline, bio, onboarded:true}`. |
| Profile editor | `GET /api/me`, `PUT /api/me/profile`, `GET/POST/PATCH/DELETE /api/me/skills[/:id]` |
| Growth dashboard | `GET /api/me/growth`. Its fields map to widgets: level/XP bar `level`, numbers `totals`, `streaks`, `momentum`, mastery bars with tooltip `mastery[].breakdown`, path `evolution.path`, curve chart `monthly[].skillsKnownCumulative` / `xpCumulative`, calendar `heatmap`, timeline `journey`, `badges`, `nextSkills`, `insights`. Gemma summary button: `POST /api/me/growth/story` |
| Skill timeline | `GET /api/me/skills/:id/history` |
| Contributions | `GET /api/me/contributions?limit=&cursor=&kind=&status=&skill=`, create/edit/delete, and an "Import from GitHub" button wired to `POST /api/me/contributions/sync-github` |
| Discover issues | `GET /api/issues?limit=10&cursor=`. Show `fitReasons`, `prerequisiteGaps`, `difficulty`, `uncertainty`, and the `ranking.breakdown` tooltip |
| Issue detail | `GET /api/issues/:owner/:repo/:number`. Show `documents`, `checklist` (badge for documented vs suggested), and `missingContext`. **If `issue.state`/`assignees` changed, display it.** |
| Mentor chat | `POST /api/mentor/chat {message, history, issue}`. Render `answer` as Markdown (sanitise it!), list `sources`, show `caveats` and `model.id` |
| Public profile | `GET /api/u/:handle`. The user must set `isPublic: true` |
| Resources | `GET /api/resources?topic=git` |

Sample responses live in `docs/samples/`. Files named `*.FIXTURE.json` are labelled examples; the others were captured from the real server running the demo user.

## Limits
- `/api/issues`: `limit` 1–25 (default 10), up to 10 pages. The cursor is opaque. The search covers up to 3 of the user's languages.
- `/api/me/contributions`: `limit` 1–100 (default 20). The cursor is opaque and keyset-based, so pages never contain duplicates.
- Mentor: `message` ≤ 2000 chars. Send at most the last 10 history messages, each ≤ 2000 chars.
- Gemma endpoints: 10–15 requests per minute per user.

# DevPath — Backend

Backend for an open-source contribution platform for students: **sign up with email + password → build a rich skill profile → watch your growth (Python → JavaScript → TypeScript → Node…) → find real beginner GitHub issues that fit you → ask a Google Gemma mentor grounded in the repository's own docs.**

Node.js (no framework) + PostgreSQL + **Google Gemma** (via Ollama or the Gemini API). Its only runtime dependency is `pg`.

---

## Where Gemma does the core work (judges' question: "which open model, and why?")

| Feature | Endpoint | What Gemma does | Without Gemma |
|---|---|---|---|
| Repository-grounded mentor | `POST /api/mentor/chat` | Reads the issue + README + CONTRIBUTING (fetched by the server), explains the issue, teaches the fundamentals, separates *documented* steps from *suggestions*, and cites sources `[S1]` | Endpoint returns `503 MODEL_UNAVAILABLE` (no fake answers) |
| Skill extraction for onboarding | `POST /api/me/skills/extract` | Turns "I built bots in Python and I'm learning TS" into structured skill suggestions with evidence | No suggestions |
| Growth story | `POST /api/me/growth/story` | Narrates the user's real growth data into a motivating summary with one next step | No story |

**Model:** Google **Gemma 3**, e.g. `gemma3:4b` (local via Ollama) or `gemma-3-27b-it` (Gemini API). The exact ID is set in `.env` and reported by `/api/health` and in every AI response (`model.id`, `model.latencyMs`).
**Why Gemma:** it's open-weight, so a student can run it on a laptop. It's strong at structured JSON output and grounded explanation, and it qualifies for Track 2 (Best Use of Gemma).
**Model license:** Gemma is released under the **[Gemma Terms of Use](https://ai.google.dev/gemma/terms)** and its [Prohibited Use Policy](https://ai.google.dev/gemma/prohibited_use_policy). These are *not* MIT. Our code's license (MIT, below) does not relicense the model.

Safety built into the Gemma layer:
- Repository text is wrapped as `<untrusted_document>` and neutralised, so instructions inside a README can't hijack the mentor (tested).
- Citations are validated against the allowed source IDs, and any URL that isn't in the retrieved sources is removed (tested).
- Gemma always returns strict JSON, with **one automatic repair round** if it misbehaves (tested).
- Skill suggestions not literally present in the user's text are dropped, so hallucinated skills don't get through (tested).
- Bounded context: message ≤ 2000 chars, last 10 history items, ≤ 6000 chars per doc, ≤ 24000 total.
- There is never a silent fallback to a non-Gemma model.

## The algorithms (deterministic, explainable — no fake AI percentages)

**Growth Engine** (`src/services/growth.js`, `GET /api/me/growth`):
- **XP and levels:** pull request 40, review 20, docs 25, issue 15, commit 5. Multipliers: merged ×1.5, open ×0.6, draft ×0.3, closed ×0.4. A learned skill adds +50, plus +10 per proficiency point. Level *n* needs `50·(n−1)·n` XP. Titles run from Explorer to Open-source Champion.
- **Per-skill mastery (0–100), with every point shown:** self-rated (0–40) + evidence from contributions tagged with the skill (0–30, diminishing returns) + practice time (0–20) + recency (0–10, 90-day decay).
- **Stack evolution path:** `Python → HTML & CSS → JavaScript → … → Express`, with the number of days between steps.
- **Milestone journey:** first skill, each skill learned ("120 days after starting"), polyglot, first PR, first merge, 5/10/25… contributions, new repositories, and level-ups replayed chronologically.
- **Activity:** weekly streaks (current and longest), a 365-day contribution heatmap, a monthly growth curve (cumulative skills and XP), and momentum (XP over the last 30 days vs the previous 30).
- 11 badges, top repositories, a category radar, and plain-language insights.
- **Next-skill recommendations** from a skill knowledge graph (`src/services/skillGraph.js`, 50+ skills with aliases): `score = 3·(#known skills that unlock it) + 2·(matches an interest) + 1·(a prerequisite is already strong)`.

**Issue matching** (`src/services/matching.js`). Each issue gets a transparent `ranking.breakdown` (weights live in `WEIGHTS`):

| Signal | Points |
|---|---|
| Language match | +30 |
| Your skills mentioned in the issue | +4 each, max +12 |
| Beginner label | +20 |
| Help wanted | +5 |
| Docs label | +5 |
| Freshness | 0–15 |
| Quiet thread (≤5 comments) | +8 |
| Clear description | +7 |
| Each missing prerequisite | −6, max −18 |
| Busy thread (>15 comments) | −10 |
| Stale (>1 year) | −10 |

Issues scoring under 20 are omitted. Every issue returns `fitReasons`, `prerequisiteGaps`, `difficulty` with a rationale, `uncertainty`, and a source-backed `firstStep`. **Limitations:** we never read the source code, a language match doesn't prove suitability, and "unassigned" doesn't guarantee the issue is available. All of this is stated in the `uncertainty` field.

## Quick start

Requirements: Node ≥ 20 and PostgreSQL ≥ 13.

```bash
cp .env.example .env            # then edit DATABASE_URL (and the Gemma settings below)
npm install
createdb devpath                # or: psql -c "create database devpath"
npm run migrate                 # creates all tables
npm run seed -- --verify --demo # learning resources (link-checked) + demo user
npm start                       # http://localhost:4000  (npm run dev = auto-reload)
```

Demo login: `demo@devpath.dev` / `DemoPass#2026`. Public demo profile: `GET /api/u/demo-student`.
API reference (OpenAPI): `GET /api/docs`, or see `docs/openapi.json` and the example responses in `docs/samples/`.

### Turn on Gemma (pick one)

**A. Local, with Ollama (no key needed):**
```bash
ollama pull gemma3:4b          # ~3.3 GB; on a low-RAM laptop use gemma3:1b
# .env
GEMMA_PROVIDER=ollama
GEMMA_MODEL=gemma3:4b
OLLAMA_URL=http://localhost:11434   # or a teammate's laptop on the same Wi-Fi: http://192.168.x.x:11434
```
If you're using a teammate's machine, start Ollama there with `OLLAMA_HOST=0.0.0.0 ollama serve`.

**B. Hosted, with a Google AI Studio key:**
```bash
# .env   (get a key at https://aistudio.google.com — never commit it)
GEMMA_PROVIDER=google
GEMMA_MODEL=gemma-3-27b-it
GOOGLE_API_KEY=your-key
```

Then check it:
```bash
curl localhost:4000/api/health     # dependencies.gemma should be "ready"
```

The server refuses to start if `GEMMA_MODEL` isn't a Gemma model ID.

### Tests

```bash
createdb devpath_test
TEST_DATABASE_URL=postgres://USER:PASS@localhost:5432/devpath_test npm test
```
There are 29 tests: unit tests for the growth engine, matching, citations, injection handling, JSON repair and validation, plus end-to-end API tests against real PostgreSQL with mocked GitHub and both Gemma runtimes. **Warning:** the API tests drop and recreate the schema of the test database.

## Security
- Passwords are hashed with **scrypt** (Node built-in), with a constant-time compare and a dummy hash for unknown emails to prevent timing leaks. There's a weak-password policy, and login/register are rate-limited per IP.
- Server-side sessions are stored in PostgreSQL (only the SHA-256 of the cookie token is stored). The cookie is `HttpOnly` and `SameSite=Lax` (plus `Secure` when `COOKIE_SECURE=true`).
- **CSRF:** every POST/PUT/PATCH/DELETE from a signed-in user must send `X-CSRF-Token`.
- Every query is scoped to `user_id`, so another user's records return 404 (tested). The public profile is opt-in and never includes the email.
- GitHub requests go only to a fixed host with validated `owner/repo/number`. Repository-supplied URLs are never fetched (no SSRF), documents are capped at 12k chars, and the cache has a TTL.
- Secrets are read only from `.env` (git-ignored) and are redacted from logs.

## Project layout
```
src/
  server.js, app.js, config.js
  lib/       router (tiny, no framework), errors, validate (schema), security, session (+CSRF)
  db/        pool, migrate, seed
  routes/    auth, profile (profile/skills/contributions/growth/public), issues (issues/mentor/resources/health)
  services/  gemma (adapter), mentor (prompts + grounding), growth (engine), matching, skillGraph, github
migrations/  001_init.sql
docs/        openapi.json, build-openapi.js, samples/*.json, HANDOFF.md, VALIDATION.md
test/        unit.test.js, api.test.js
```

## License
Code: MIT (see `LICENSE`). Model: Google Gemma, under the [Gemma Terms of Use](https://ai.google.dev/gemma/terms).

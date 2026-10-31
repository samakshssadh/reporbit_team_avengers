# Validation report

Environment: Node 22.23, PostgreSQL 16.15 (Linux sandbox). Run date: 2026-10-31.

## Passed (29/29 automated, `npm test`)
- **Auth:** register (email normalised), duplicate email 409, weak password 400, wrong password 401, session lookup, logout, password hashes never returned
- **Boundaries:** unauthenticated 401, missing CSRF 403, cross-user read/edit/delete of skills and contributions returns 404, Bob sees none of Alice's data
- **Profile:** rich update, contract `skills/interests/experience` shape, invalid enum and unknown field rejected
- **Skills:** alias normalisation, duplicate 409, the growth log writes `started → level_up → learned`, `learnedAt` before `startedAt` rejected, bulk add skips duplicates
- **Contributions:** keyset cursor pagination (no duplicates across pages), filters, bad cursor 400
- **GitHub sync:** idempotent (second run updates, inserts 0), merged/open status mapped, repo languages tagged as skills
- **Growth:** XP, levels, mastery breakdown sums correctly, streaks, evolution path, milestones, badges, empty user; public profile doesn't leak email; private profile 404
- **Issues:** pull requests, closed and assigned issues excluded; every contract field present; ranking score equals the sum of its breakdown; `limit` > 25 rejected; second request served from `cached`
- **Issue detail:** README/CONTRIBUTING/community with source IDs, documented vs suggested checklist, missing context disclosed, PR number 404, path-traversal identifiers 400
- **Gemma:** unconfigured returns honest 503 + health `unconfigured`; Ollama request format (`/api/chat`, `format: json`); Google request format (`:generateContent`, `x-goog-api-key`, no `systemInstruction`); unknown citation `[S9]` removed; invented URL removed; repo text wrapped as untrusted; invalid JSON auto-repaired; timeout 504; hallucinated skill dropped
- **GitHub rate limit:** 429 with `retryAfterSeconds` and a `Retry-After` header
- **Manual:** real server booted, demo user logged in, `/api/me/growth` produced level 5 "Builder" with evolution path `Python → HTML & CSS → JavaScript → SQL → Node.js → React → TypeScript → PostgreSQL → Express`

## Not run in this sandbox (run these on the team laptop)
1. **A real Gemma request.** No model weights or API key were available here. Run the commands below and record the model ID and latency from the response's `model.latencyMs`:
   ```bash
   curl localhost:4000/api/health
   # log in, then POST /api/me/skills/extract {"text":"I know Python and I'm learning TypeScript"}
   ```
2. **The live GitHub API.** It was blocked by the sandbox network, so it was tested against a mock that mirrors the GitHub REST response shapes. Review at least 5 real issues from `GET /api/issues` against their GitHub pages.
3. **Learning-resource link check.** It was also blocked by the sandbox network, so every `reviewedAt` is currently `null` (honest). Run `npm run seed -- --verify` on a machine with internet access to set `reviewedAt` for the links that respond.

## Known limitations
- GitHub contribution sync covers public PRs and issues only (up to 100 each). Commits and reviews are logged manually.
- The in-memory rate limiter is per process, which is fine for a single hackathon server.
- Matching never reads source code. Difficulty is an estimate from labels and text, and says so.

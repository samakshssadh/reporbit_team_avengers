# Repo Match — Version 0 (v0.0.0)

Requires Node.js 22+. No dependencies, database, or build step. A Google API key is required for Gemma features.

```sh
cd repo-match-v0
npm start
```

Open http://localhost:3000. Select 1–3 skills and experience, then search.

Optional: copy `.env.example` to `.env` and supply `GITHUB_TOKEN` for a larger GitHub API allowance. Public data only; no repository write permissions needed. The token stays on the server and is never returned to the browser. Restart after changing .env. Without a token a search may exhaust the unauthenticated allowance; cached responses last 5 minutes.

## Matching
Search each selected language/topic independently for public, nonarchived, nonfork repositories pushed within the past year, sorted by recent update. Each candidate batch reads four search hits per skill and analyzes at most six unique repositories with issues enabled. This is a bounded discovery MVP, not an exhaustive GitHub index. Results may match some rather than all skills, with partial coverage reflected in the score. Topic matching depends on repository topic metadata.

Weights: stack coverage 40; experience-aligned unassigned issue 30; latest push 15; median first maintainer review 15. Unknown review data gets zero points. Issue labels identify easy tasks; advanced labels/title keywords suggest hard tasks; unlabeled tasks default to medium with low confidence. README setup, test, contribution and complex-systems keywords provide separate evidence, not verified code analysis. No repository code is executed.

Update cadence uses median gaps between 20 recent commits. Review time uses up to three latest-created pull requests, with up to 100 reviews each, counting the first review from OWNER/MEMBER/COLLABORATOR excluding the author and bots. Unreviewed PRs are excluded and the sample coverage is displayed. Fast review samples do not guarantee future response times. Issue recommendations sample 30 recently updated open items, excluding PRs and assigned issues.

GitHub REST endpoints: search/repositories, repos/{owner}/{repo}/readme, languages, issues, commits, pulls, pulls/{number}/reviews. Reference: https://docs.github.com/en/rest

`npm test` checks scoring, missing data and difficulty classification. Server binds to 127.0.0.1 only. Errors and partial evidence are shown explicitly. No demo or fabricated repositories are returned.

## Google Gemma chatbot and summaries

Set `GOOGLE_API_KEY` in `.env`, then restart. The server uses Google's Generative Language API with a **Gemma** model (never silently switches to Gemini). It lists available models and prefers Gemma 4 26B A4B, Gemma 4 31B, then Gemma 3 27B. Set `GEMMA_MODEL` to a specific Gemma model ID to override discovery. Project IDs are not API keys and are not needed for this API-key authentication flow.

Click **Chat with Gemma** to ask coding questions. **Summarise with Gemma** on a repository card selects that repository and starts a summary; follow-up questions retain that context. **New chat** clears both context and history. The last five exchanges are sent with each question. Chat is kept in browser memory, not saved permanently.

Repository summaries read the README (up to 14k characters), up to six selected manifests/contribution guides/source files (6k each), and up to 180 tree paths. The UI shows coverage, filenames and retrieval failures. This is not a full-repository audit and does not execute or verify repository code. Your chat and those public excerpts are sent to Google only when you ask. Repository evidence is treated as untrusted text. Output is displayed as plain text, never executed as HTML. API keys stay in the ignored server .env and are not placed in prompts, URLs or responses.

Provider access, quota, model availability and network errors are shown in the chat. A configured key is not proof that Google accepts it. Tests mock Google/GitHub responses; live provider access must be verified separately.

## Download and run version 0

Download [repo-match-v0.zip](./repo-match-v0.zip), extract it, and open a terminal in the extracted `repo-match-v0` folder.
Copy `.env.example` to `.env`, add your own `GOOGLE_API_KEY`, then run `npm start`. Keep the terminal open and visit http://localhost:3000.
If port 3000 is occupied, set `PORT=3001` in `.env` and visit http://localhost:3001.
API keys are excluded from the archive. Never commit `.env`.
This project requires a running Node.js server; GitHub Pages alone cannot host its backend.

## Model licensing

- Gemma 4: [Apache License 2.0](https://ai.google.dev/gemma/apache_2).
- If configured or automatically selected: Gemma 3 uses [Gemma Terms of Use](https://ai.google.dev/gemma/terms).
- Hosted API usage is also subject to the provider terms. These links describe model licensing, not this application's license; see the repository LICENSE file for application licensing.

## Version 0 limitations

Matching and summaries use bounded repository samples. They do not verify execution or audit the full codebase.
Eight automated tests cover matching, chat validation, Gemma selection and file sampling. Live chat and a limited repository summary previously succeeded; later sessions encountered local server lifetime and upstream access issues. Availability depends on your network and provider credentials/quota.

# Reporbit: open-source discovery, contribution roadmaps and Google Gemma AI

Reporbit helps students who know basic coding make their **first open-source contribution**. It recommends real GitHub repositories with beginner issues that match your stack, generates a step-by-step contribution roadmap grounded in each repo's own README/CONTRIBUTING, and gives you an AI mentor. **All of the AI in the product is Google Gemma, an open-weight model.**

```
orbit/
  backend/    Node.js + PostgreSQL + Gemma. Serves the API at /api AND the compiled frontend at /
  frontend/   React + Vite + Tailwind (Reporbit UI) source
```

## Run everything (one server, one URL)

Requirements: Node 20+, PostgreSQL 13+. Gemma runs through **Ollama** (local) or a **Google AI Studio** key.

```bash
cd backend
cp .env.example .env        # set DATABASE_URL, GITHUB_TOKEN, and the Gemma settings (below)
npm install
npm run migrate
npm run seed -- --verify --demo
npm start                   # open http://localhost:4000
```

`backend/public/` already contains a compiled build of the frontend, so you don't need to build it.
After changing anything in `frontend/`, rebuild and re-copy it with:
```bash
cd backend && npm run build:frontend
```

**Frontend dev mode (hot reload):** run `npm start` in `backend/` and `npm run dev` in `frontend/`, then open http://localhost:5173. Vite proxies `/api` to port 4000.

### Gemma (required for the AI features)
| Option | `.env` |
|---|---|
| Local, with Ollama | `GEMMA_PROVIDER=ollama`, `GEMMA_MODEL=gemma3:4b` (first run `ollama pull gemma3:4b`; on a low-RAM laptop use `gemma3:1b`) |
| Google AI Studio | `GEMMA_PROVIDER=google`, `GEMMA_MODEL=gemma-3-27b-it`, `GOOGLE_API_KEY=...` |

Check it with `curl localhost:4000/api/health`, which should show `"gemma":"ready"`.

### GitHub token (strongly recommended)
Repository discovery calls GitHub's search API. Anonymous access allows only ~10 searches per minute and 60 requests per hour, which isn't enough for a live demo. Create a token at GitHub → Settings → Developer settings → **Fine-grained token**, with **no permissions** (public read is enough), and put it in `GITHUB_TOKEN=`.

## What's new in v2
- A landing page, then sign in or create an account (stored in PostgreSQL), then onboarding: tech stack (90+ options), experience in months or years, profession, and prior contributions
- A liquid-glass UI in tangerine `#fe8500` and charcoal `#21232e`, with a boxless star constellation and a redesigned repository panel
- Orbit AI handles casual chat like ChatGPT (greetings, slang, Hinglish) and stays grounded for repo questions
- **Dummy PR:** paste code, and Gemma reviews it like a maintainer, with line-by-line comments, fixes, and a verdict
- Render compiles the frontend on every deploy (see `render.yaml`)

## Where Gemma does the core work
| Feature | UI | API | What Gemma does |
|---|---|---|---|
| Contribution roadmap | "Roadmap" on a repository | `GET /api/repositories/:owner__repo/roadmap` | Writes a 5-step first-contribution plan from the repo's README and CONTRIBUTING. File names and commands that don't appear in those docs are removed. |
| Dummy PR review | Dummy PR tab | `POST /api/review` | Reviews pasted code like a maintainer: bugs, security, edge cases, and fixes. Invalid line numbers are dropped, and code is never run. |
| Orbit AI mentor | Orbit AI tab + floating chat | `POST /api/chat` | Answers questions grounded in the selected repo's docs, cites sources, and treats repo text as untrusted. |
| Skill extraction, growth story | backend API (profile features) | `/api/me/skills/extract`, `/api/me/growth/story` | Structured extraction and narration of real data. |

If Gemma is unreachable, the chat says so explicitly. **It never shows a canned "AI" answer.** The roadmap falls back to clearly labelled rule-based steps (`generatedBy: "rules"`).

**Model:** Google Gemma 3 (the exact ID is shown in every chat reply and in `/api/health`).
**Model license:** [Gemma Terms of Use](https://ai.google.dev/gemma/terms). **Code license:** MIT (`LICENSE`).

The repository match scores, maintainer metrics (median time to merge, merge ratio over the last 30 closed PRs, cadence) and issue difficulty are deterministic and computed from real GitHub data. Anything not measured is shown as "Not measured". See `backend/README.md` for the algorithms, the security model and the tests (`npm test`, 32 tests).

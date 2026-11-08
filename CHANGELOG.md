# Reporbit changelog

Every update to Reporbit, in plain words: **what changed** and **why**.
Newest first. Each version's code lives in its own folder (`v0/` … `v6/`).

**How the numbers work**
- A **whole number** (version 6) is a big update: new features or a new folder.
- A **decimal** (version 6.1, 6.2 …) is a smaller update: a fix or an improvement to the current version.

---

## Version 6 (folder `v6/`, current)

### 6.6: Clear update notes
- **What:** Added this changelog and a guide for writing update notes (`CONTRIBUTING.md`).
- **Why:** So anyone, even someone new to the project, can understand every update and the reason for it.

### 6.5: Live site runs from the v6 folder; database repairs itself
- **What:** Vercel now builds the site from `v6/`. If the database is empty or partly wiped, the site rebuilds its tables automatically.
- **Why:** The database was wiped and new accounts failed with a "500" error. This makes the site recover by itself.

### 6.4: Better Gemma settings, safer error messages
- **What:** Easier settings for the Google Gemma AI model. API keys are hidden if they ever appear in an error message.
- **Why:** Simpler setup, and secret keys must never be shown on screen.

### 6.3: Vercel hosting for v6
- **What:** Added the files Vercel needs to host the site.
- **Why:** So every update pushed to GitHub goes live automatically in about 1–2 minutes.

### 6.2: Undo a mistake in v5
- **What:** Removed the Vercel files that 6.1 added to `v5/`.
- **Why:** `v5/` should stay exactly as it was released.

### 6.1: Vercel hosting (added to the wrong folder)
- **What:** First attempt at Vercel hosting, placed in `v5/` by mistake.
- **Why:** Kept in the history for honesty; it was undone in 6.2.

### 6: Follow repositories, leaderboard
- **What:** Users can follow repositories, see a leaderboard and refresh to find new repos, plus other improvements.
- **Why:** To make Reporbit more social and keep the repo list fresh.

## Version 5 (folder `v5/`)

### 5.2: Smoother light mode, stay signed in
- **What:** Removed heavy visual effects in light mode; sign-ins now last 30 days.
- **Why:** Light mode felt laggy, and users had to log in again too often.

### 5.1: Readable light mode, new animations
- **What:** Stronger contrast and warmer colours in light mode; new animations on the boot-up screen, the landing page and sign-in.
- **Why:** Text and stars were hard to see in light mode.

### 5: Dark mode, boot-up animation, Connect GitHub
- **What:** Light/dark switch, boot-up animation, Connect GitHub (contributions are checked automatically), badge guide, faster repo search, personal AI roadmaps, deletable chats.
- **Why:** A big polish pass to make Reporbit feel complete and easy to use.

## Version 4 (folder `v4/`)

### 4: Bigger Dummy PR uploads, Gemma 4
- **What:** Dummy PR accepts whole project .zip uploads; Orbit AI runs on Gemma 4.
- **Why:** Students wanted to practise on real projects, not just short snippets.

### 4 (draft)
- **What:** KEZED's first draft of version 4.

## Version 3 (folder `v3/`)

### 3.3: Gemma 4 support
- **What:** Orbit AI works with Google's Gemma 4 models.
- **Why:** The available Google key only allowed Gemma 4 models.

### 3.2: Dummy PR reviews whole projects
- **What:** Upload a .zip or a code file; there is no 500-line limit.

### 3.1: One folder per version
- **What:** Organised the repo into `v0/`, `v1/`, `v2/`, `v3/`.
- **Why:** So every stage of the project is easy to find.

### 3: More repos, faster, profile page
- **What:** Repos from GitLab and Bitbucket too, faster loading, a tidier constellation, and a profile page that shows your growth.

## Version 2 (folder `v2/`)

### 2.2: Removed the zip file
- **Why:** The code is now stored directly, so the zip was no longer needed.

### 2.1: Version 2 code
- **What:** Landing page, sign-up, onboarding, Dummy PR, friendlier Orbit AI.

### 2: Version 2 zip file
- **What:** First upload of version 2, as a zip file.

## Version 1 (folder `v1/`)

### 1.1: Ready for hosting
- **What:** Prepared version 1 to run online on Render.

### 1: Original draft
- **What:** The first real Reporbit: backend, database, website and GitHub repo search.

## Version 0 (folder `v0/`)

### 0: Test of Google Gemma
- **What:** An early prototype (called Repo Match) to test Google Gemma.

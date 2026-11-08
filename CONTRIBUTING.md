# How to update Reporbit

These rules apply to **everyone**: teammates and AI tools (Claude, Antigravity, Copilot …).
The goal: anyone, even a newcomer, can understand every update and **why** it was made.

## 1. Name every commit like this

```
version <number>: <what changed, in plain words>
```

- **Whole number** (`version 7`): a big update with new features or a new folder.
- **Decimal** (`version 6.6`, `version 6.7` …): a smaller fix or improvement.
- Use the next number in order. Check the latest one in `CHANGELOG.md`.

Good: `version 6.7: Fix the sign-in button not working on phones`
Bad: `fix(auth): patch handler`, `update`, `changes`, `wip`

## 2. Explain *why* in the commit description

Below the first line, add one or two plain sentences: **what** changed and **why**.

```
version 6.7: Fix the sign-in button not working on phones

What: The button was hidden behind the menu on small screens.
Why: Phone users could not sign in.
```

## 3. Add an entry to `CHANGELOG.md`

Add your version at the top of the current version's section, with a **What** and a **Why** line.

## 4. Never do these

- **Never force-push** and never delete or rewrite history. That erases other people's work.
- **Never move or delete the version folders** (`v0/` … `v6/`). Work only inside the current one (`v6/`).
- **Never commit secrets**: `.env` files, API keys or passwords.
- Avoid jargon. If a word needs explaining, explain it.

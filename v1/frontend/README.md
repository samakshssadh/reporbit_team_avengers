# Orbit — Open Source Discovery, Roadmaps & Gemma AI

> **Hack Day Track 2: Best Use of Gemma**  
> Built for Hacktoberfest Hack Day Hyderabad 2026.  
> **Code License:** [MIT License](./LICENSE)  
> **AI Brain:** [Google Gemma 2 (Open-Weight Model)](https://ai.google.dev/gemma) under the [Gemma Terms of Use](https://ai.google.dev/gemma/terms).

---

## 🌟 What is Orbit?

**Orbit** is an open-source intelligence platform that helps developers transition from passive software consumers into active open-source contributors.

It turns open-source discovery into an interactive cosmic constellation, provides step-by-step contribution roadmaps, offers curated Git and language learning paths, and features **Orbit AI** — a deeply contextual conversational assistant powered by Google's open-weight **Gemma 2** model.

---

## 🔭 Core Experiences

### 1. Repositories — Interactive Constellation
- **Constellation Canvas:** Powered by `@xyflow/react`, repositories are rendered as glowing star nodes on a deep-space canvas, clustered and connected by shared programming languages and architecture domains.
- **Repository Details & Score Breakdown:** Displays 100-point match scores factoring in stack overlap, difficulty fit, maintainer review turnaround, and documentation quality.
- **Contribution Roadmap:** 5-stage interactive guide (Environment, Architecture, Issue Selection, Implementation, Testing & PR) with step completion checklists and copyable commands.
- **Accessible List Alternative:** Toggle between the graphic constellation and an accessible table/list view.

### 2. Learn — Two Consistent Learning Paths
- **Learn Git:** A 6-stage mastery path covering `clone`, branching, atomic commits, interactive rebasing, conflict resolution, and perfect GitHub PR etiquette.
- **Learn Languages:** Search technology roadmaps (Python, TypeScript, Go, Rust) with curated YouTube lectures and official documentation links.

### 3. Orbit AI — Powered by Google Gemma
- **Claude-Inspired Calm UI:** Full-screen conversation layout with session history, prompt starters, and clean typography.
- **Contextual Intelligence:** Discuss specific repositories or learning stages; the attached repository context flows seamlessly into Gemma prompt reasoning.
- **Floating Launcher:** Compact floating assistant available across all pages with an instant drawer and 1-click full-page expander.

---

## 🛠️ Tech Stack

- **Framework:** React 18 + TypeScript
- **Bundler & Dev Server:** Vite 6
- **Styling & Design Tokens:** Tailwind CSS + custom Apple & Claude aesthetic tokens
- **Graph & Constellation Engine:** React Flow (`@xyflow/react`)
- **Animations:** Motion (`framer-motion`) & Tailwind transitions
- **Icons:** Lucide React
- **Model Integration:** Google Gemma 2 (via local Ollama or Google AI Studio REST backend)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 20 & 24)
- npm or pnpm

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/orbit-frontend.git
cd orbit-frontend

# 2. Copy environment placeholders
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📡 Backend & Live vs Demo Mode

Orbit is designed to connect to the Orbit backend via `VITE_API_BASE_URL` (configured in `.env`).

- If the backend is offline or during a live demonstration where internet connectivity is unpredictable, Orbit's **built-in Mock Engine** automatically engages.
- You can manually toggle between **Live API** and **Demo Mock Mode** at any time using the status badge in the top navigation bar.

---

## 🛡️ Secrets & Security

- No API keys or secrets are committed or stored in client-side code.
- All requests communicate with the designated backend adapter or use safe local mocks.
- All external links use protocol validation (`isSafeUrl`) preventing `javascript:` injection.

---

## 📄 Licensing

- Software source code is licensed under the [MIT License](./LICENSE).
- The underlying AI model is **Google Gemma 2**, governed by the official [Gemma Terms of Use](https://ai.google.dev/gemma/terms).

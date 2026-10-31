import { Repository, LearningPath, GitCurriculumTopic, ContributionRoadmap } from "../types";

export const MOCK_REPOSITORIES: Repository[] = [
  {
    id: "pmndrs-zustand",
    name: "zustand",
    owner: "pmndrs",
    fullName: "pmndrs/zustand",
    description: "🐻 Bear necessities for state management in React. Small, fast, and scalable bearbones state-management solution.",
    url: "https://github.com/pmndrs/zustand",
    stars: 48200,
    forks: 1650,
    openIssues: 32,
    goodFirstIssuesCount: 4,
    primaryLanguage: "TypeScript",
    languages: ["TypeScript", "JavaScript", "React"],
    matchedSkills: ["TypeScript", "React"],
    topics: ["state-management", "react", "hooks", "typescript"],
    difficulty: "Beginner-Friendly",
    matchScore: 96,
    scoreBreakdown: {
      techStackOverlap: 39,
      difficultyFit: 24,
      activityAndResponsiveness: 19,
      documentationQuality: 14,
      explanation: "Direct match with your React & TypeScript experience. Fast maintainer reviews (avg 18h) and high test coverage."
    },
    maintainerMetrics: {
      medianReviewTime: "18 hours",
      mergeRatio: "88%",
      activeMaintainers: 5,
      cadence: "Daily",
      goodFirstIssueResolutionRate: "94%"
    },
    recentUpdate: "2026-10-28T14:32:00Z",
    setupComplexity: "Low",
    setupCommand: "pnpm install && pnpm test",
    readmeCoverage: "High (Comprehensive examples & middleware guides)",
    sampleIssues: [
      {
        id: "z-1",
        number: 2841,
        title: "docs: Add example for useShallow with nested selector arrays",
        labels: ["good first issue", "documentation"],
        url: "https://github.com/pmndrs/zustand/issues",
        difficulty: "Easy"
      },
      {
        id: "z-2",
        number: 2835,
        title: "test: Add unit test verifying SSR hydration edge-case",
        labels: ["help wanted", "tests"],
        url: "https://github.com/pmndrs/zustand/issues",
        difficulty: "Medium"
      }
    ],
    constellation: {
      x: 120,
      y: 180,
      group: "frontend",
      brightness: 0.95
    }
  },
  {
    id: "excalidraw-excalidraw",
    name: "excalidraw",
    owner: "excalidraw",
    fullName: "excalidraw/excalidraw",
    description: "Virtual whiteboard for sketching hand-drawn like diagrams. Collaborative, end-to-end encrypted, and deeply extensible.",
    url: "https://github.com/excalidraw/excalidraw",
    stars: 87400,
    forks: 8300,
    openIssues: 310,
    goodFirstIssuesCount: 12,
    primaryLanguage: "TypeScript",
    languages: ["TypeScript", "React", "Canvas", "WebSockets"],
    matchedSkills: ["TypeScript", "React"],
    topics: ["diagrams", "whiteboard", "canvas", "react", "collaboration"],
    difficulty: "Intermediate",
    matchScore: 92,
    scoreBreakdown: {
      techStackOverlap: 38,
      difficultyFit: 22,
      activityAndResponsiveness: 18,
      documentationQuality: 14,
      explanation: "Excellent for React engineers looking to learn HTML5 Canvas, mathematical geometry, and real-time collaboration."
    },
    maintainerMetrics: {
      medianReviewTime: "1.2 days",
      mergeRatio: "81%",
      activeMaintainers: 8,
      cadence: "Daily",
      goodFirstIssueResolutionRate: "89%"
    },
    recentUpdate: "2026-10-30T09:12:00Z",
    setupComplexity: "Low",
    setupCommand: "yarn && yarn start",
    readmeCoverage: "High (Architecture diagrams & contributor guide)",
    sampleIssues: [
      {
        id: "ex-1",
        number: 8412,
        title: "fix: Keyboard navigation shortcut clash on Firefox Linux",
        labels: ["good first issue", "bug", "a11y"],
        url: "https://github.com/excalidraw/excalidraw/issues",
        difficulty: "Easy"
      },
      {
        id: "ex-2",
        number: 8390,
        title: "feat: Export SVG with custom CSS font definitions",
        labels: ["feature", "canvas"],
        url: "https://github.com/excalidraw/excalidraw/issues",
        difficulty: "Medium"
      }
    ],
    constellation: {
      x: 320,
      y: 110,
      group: "frontend",
      brightness: 0.9
    }
  },
  {
    id: "fastify-fastify",
    name: "fastify",
    owner: "fastify",
    fullName: "fastify/fastify",
    description: "Fast and low overhead web framework for Node.js. High-performance JSON serialization and rich plugin architecture.",
    url: "https://github.com/fastify/fastify",
    stars: 32900,
    forks: 2350,
    openIssues: 45,
    goodFirstIssuesCount: 6,
    primaryLanguage: "JavaScript",
    languages: ["JavaScript", "TypeScript", "Node.js"],
    matchedSkills: ["TypeScript", "Node.js"],
    topics: ["nodejs", "web-framework", "high-performance", "api"],
    difficulty: "Intermediate",
    matchScore: 88,
    scoreBreakdown: {
      techStackOverlap: 34,
      difficultyFit: 23,
      activityAndResponsiveness: 19,
      documentationQuality: 12,
      explanation: "Ideal for backend JavaScript/TypeScript developers interested in HTTP internals, schema validation, and speed."
    },
    maintainerMetrics: {
      medianReviewTime: "14 hours",
      mergeRatio: "91%",
      activeMaintainers: 6,
      cadence: "Daily",
      goodFirstIssueResolutionRate: "92%"
    },
    recentUpdate: "2026-10-29T18:44:00Z",
    setupComplexity: "Low",
    setupCommand: "npm install && npm test",
    readmeCoverage: "High (Extensive plugin docs & benchmarks)",
    sampleIssues: [
      {
        id: "fas-1",
        number: 5210,
        title: "docs: Clarify reply.header type definitions for multi-value headers",
        labels: ["good first issue", "types"],
        url: "https://github.com/fastify/fastify/issues",
        difficulty: "Easy"
      }
    ],
    constellation: {
      x: 520,
      y: 220,
      group: "backend",
      brightness: 0.88
    }
  },
  {
    id: "google-gemma-recipes",
    name: "gemma-cookbook",
    owner: "google-gemini",
    fullName: "google-gemini/gemma-cookbook",
    description: "A collection of guides and recipes for Google's open-weight Gemma models: fine-tuning, inference, RAG, and agent integration.",
    url: "https://github.com/google-gemini/gemma-cookbook",
    stars: 4890,
    forks: 620,
    openIssues: 19,
    goodFirstIssuesCount: 8,
    primaryLanguage: "Python",
    languages: ["Python", "Jupyter", "PyTorch", "Keras"],
    matchedSkills: ["Python", "AI/ML"],
    topics: ["gemma", "open-weight", "llm", "fine-tuning", "rag", "agents"],
    difficulty: "Beginner-Friendly",
    matchScore: 98,
    scoreBreakdown: {
      techStackOverlap: 40,
      difficultyFit: 25,
      activityAndResponsiveness: 18,
      documentationQuality: 15,
      explanation: "Direct Track 2 Gemma alignment. Welcoming community recipes for structured outputs, quantization, and local Ollama runs."
    },
    maintainerMetrics: {
      medianReviewTime: "24 hours",
      mergeRatio: "85%",
      activeMaintainers: 4,
      cadence: "Daily",
      goodFirstIssueResolutionRate: "90%"
    },
    recentUpdate: "2026-10-30T16:15:00Z",
    setupComplexity: "Low",
    setupCommand: "pip install -r requirements.txt",
    readmeCoverage: "High (Colab notebooks and runnable scripts)",
    sampleIssues: [
      {
        id: "gem-1",
        number: 142,
        title: "recipe: Add Ollama structured JSON extraction example for Gemma 2",
        labels: ["good first issue", "cookbook", "gemma2"],
        url: "https://github.com/google-gemini/gemma-cookbook/issues",
        difficulty: "Easy"
      },
      {
        id: "gem-2",
        number: 139,
        title: "docs: Update LoRA hyperparameter recommendations for consumer GPUs",
        labels: ["documentation", "fine-tuning"],
        url: "https://github.com/google-gemini/gemma-cookbook/issues",
        difficulty: "Medium"
      }
    ],
    constellation: {
      x: 260,
      y: 350,
      group: "ai",
      brightness: 1.0
    }
  },
  {
    id: "ollama-ollama",
    name: "ollama",
    owner: "ollama",
    fullName: "ollama/ollama",
    description: "Get up and running with large language models locally. Simple CLI, REST API, and native hardware acceleration.",
    url: "https://github.com/ollama/ollama",
    stars: 104000,
    forks: 8900,
    openIssues: 180,
    goodFirstIssuesCount: 15,
    primaryLanguage: "Go",
    languages: ["Go", "C++", "Python"],
    matchedSkills: ["Go"],
    topics: ["llm", "local-ai", "go", "cli", "hardware-acceleration"],
    difficulty: "Challenging",
    matchScore: 84,
    scoreBreakdown: {
      techStackOverlap: 32,
      difficultyFit: 20,
      activityAndResponsiveness: 18,
      documentationQuality: 14,
      explanation: "Tremendous learning opportunity for Go and C++ systems programmers working on local AI inference."
    },
    maintainerMetrics: {
      medianReviewTime: "2 days",
      mergeRatio: "76%",
      activeMaintainers: 12,
      cadence: "Daily",
      goodFirstIssueResolutionRate: "81%"
    },
    recentUpdate: "2026-10-30T21:05:00Z",
    setupComplexity: "Medium",
    setupCommand: "go build .",
    readmeCoverage: "High (API specifications and model library guides)",
    sampleIssues: [
      {
        id: "ol-1",
        number: 4520,
        title: "cli: Improve error message when GPU VRAM allocation fails",
        labels: ["good first issue", "cli"],
        url: "https://github.com/ollama/ollama/issues",
        difficulty: "Easy"
      }
    ],
    constellation: {
      x: 640,
      y: 380,
      group: "systems",
      brightness: 0.85
    }
  },
  {
    id: "supabase-supabase",
    name: "supabase",
    owner: "supabase",
    fullName: "supabase/supabase",
    description: "The open source Firebase alternative. Build production backends with PostgreSQL, Auth, Edge Functions, Realtime, and Storage.",
    url: "https://github.com/supabase/supabase",
    stars: 76500,
    forks: 5800,
    openIssues: 215,
    goodFirstIssuesCount: 18,
    primaryLanguage: "TypeScript",
    languages: ["TypeScript", "PostgreSQL", "Go", "Elixir"],
    matchedSkills: ["TypeScript", "React", "PostgreSQL"],
    topics: ["postgresql", "firebase-alternative", "realtime", "auth"],
    difficulty: "Intermediate",
    matchScore: 91,
    scoreBreakdown: {
      techStackOverlap: 37,
      difficultyFit: 23,
      activityAndResponsiveness: 18,
      documentationQuality: 13,
      explanation: "Wide breadth of sub-packages: Studio dashboard in React, CLI in Go, backend in Postgres. Very responsive triage team."
    },
    maintainerMetrics: {
      medianReviewTime: "1.5 days",
      mergeRatio: "84%",
      activeMaintainers: 15,
      cadence: "Daily",
      goodFirstIssueResolutionRate: "87%"
    },
    recentUpdate: "2026-10-30T17:50:00Z",
    setupComplexity: "Medium",
    setupCommand: "npm run dev:studio",
    readmeCoverage: "High (Multi-tier architecture and development guide)",
    sampleIssues: [
      {
        id: "sup-1",
        number: 19820,
        title: "studio: Copy SQL button should indicate copied state with checkmark",
        labels: ["good first issue", "ui", "studio"],
        url: "https://github.com/supabase/supabase/issues",
        difficulty: "Easy"
      }
    ],
    constellation: {
      x: 440,
      y: 490,
      group: "backend",
      brightness: 0.92
    }
  },
  {
    id: "huggingface-transformers",
    name: "transformers",
    owner: "huggingface",
    fullName: "huggingface/transformers",
    description: "State-of-the-art Machine Learning for PyTorch, TensorFlow, and JAX. Seamless loading for Gemma, Llama, and Mistral.",
    url: "https://github.com/huggingface/transformers",
    stars: 138000,
    forks: 26000,
    openIssues: 540,
    goodFirstIssuesCount: 22,
    primaryLanguage: "Python",
    languages: ["Python", "PyTorch", "Rust"],
    matchedSkills: ["Python", "AI/ML"],
    topics: ["machine-learning", "deep-learning", "nlp", "vision", "pytorch"],
    difficulty: "Challenging",
    matchScore: 89,
    scoreBreakdown: {
      techStackOverlap: 36,
      difficultyFit: 21,
      activityAndResponsiveness: 17,
      documentationQuality: 15,
      explanation: "The industry standard ML library. Outstanding contribution templates and automated test harnesses."
    },
    maintainerMetrics: {
      medianReviewTime: "1.8 days",
      mergeRatio: "79%",
      activeMaintainers: 20,
      cadence: "Daily",
      goodFirstIssueResolutionRate: "85%"
    },
    recentUpdate: "2026-10-30T22:18:00Z",
    setupComplexity: "High",
    setupCommand: "pip install -e '.[dev]'",
    readmeCoverage: "High (World-class documentation & tutorials)",
    sampleIssues: [
      {
        id: "tr-1",
        number: 31204,
        title: "docs: Fix docstring typo in GemmaTokenizer Fast encoding options",
        labels: ["good first issue", "documentation"],
        url: "https://github.com/huggingface/transformers/issues",
        difficulty: "Easy"
      }
    ],
    constellation: {
      x: 180,
      y: 530,
      group: "ai",
      brightness: 0.94
    }
  }
];

export const MOCK_ROADMAPS: Record<string, ContributionRoadmap> = {
  "google-gemma-recipes": {
    repositoryId: "google-gemma-recipes",
    repositoryName: "google-gemini/gemma-cookbook",
    estimatedTimeToFirstPR: "3 - 5 hours",
    prerequisites: ["Python 3.10+", "Basic understanding of LLMs & prompting", "Git & GitHub account"],
    steps: [
      {
        stepNumber: 1,
        category: "Environment",
        title: "Clone, Virtual Environment & Dependencies",
        summary: "Fork the repo and set up an isolated Python virtual environment with minimal GPU/CPU requirements.",
        details: [
          "Fork google-gemini/gemma-cookbook on GitHub.",
          "Clone your fork locally: git clone https://github.com/<your-username>/gemma-cookbook.git",
          "Create a venv: python3 -m venv .venv && source .venv/bin/activate",
          "Install requirements: pip install -r requirements.txt"
        ],
        keyFiles: ["requirements.txt", "README.md"],
        commandToRun: "git clone https://github.com/your-username/gemma-cookbook.git && cd gemma-cookbook && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt",
        proTip: "Use Ollama locally so you don't even need paid cloud tokens for local notebook runs!"
      },
      {
        stepNumber: 2,
        category: "Architecture",
        title: "Understand the Recipes Structure",
        summary: "Examine how cookbook notebooks and scripts are organized into fine-tuning, RAG, and agentic workflows.",
        details: [
          "Check the /examples/ or /notebooks/ folder to see the existing patterns.",
          "Note the standard notebook headers: Model Used, Prerequisites, Colab badge, and License.",
          "Verify that each recipe runs self-contained without hidden global dependencies."
        ],
        keyFiles: ["examples/structured_outputs/", "examples/rag/"],
        proTip: "Always follow the Google developer documentation style guide for markdown cells."
      },
      {
        stepNumber: 3,
        category: "Issue Selection",
        title: "Select a 'Good First Issue' or Propose a Recipe",
        summary: "Browse issues labeled 'good first issue' or open an RFC issue proposing a new recipe (e.g. structured JSON with Gemma 2).",
        details: [
          "Check issues filter: is:issue is:open label:\"good first issue\"",
          "Comment on the issue stating: 'I would like to work on this, here is my proposed approach...'",
          "Wait for maintainer acknowledgment before starting deep work."
        ],
        keyFiles: [".github/ISSUE_TEMPLATE/"],
        proTip: "Maintainers love when you explicitly state your hardware environment and target Gemma model version."
      },
      {
        stepNumber: 4,
        category: "Implementation",
        title: "Draft Your Solution & Test Edge Cases",
        summary: "Write clean, commented Python code following PEP 8 and test on both CPU and local acceleration.",
        details: [
          "Create a descriptive feature branch: git checkout -b feat/gemma2-json-recipe",
          "Add docstrings explaining input/output schemas.",
          "Ensure no hardcoded API keys or personal paths are saved in notebook metadata."
        ],
        keyFiles: ["examples/new_recipe.ipynb"],
        proTip: "Clear all notebook outputs before committing so git diffs stay small and clean."
      },
      {
        stepNumber: 5,
        category: "Testing & PR",
        title: "Run Linters, Clean History & Submit PR",
        summary: "Format code with Black/Ruff, test imports cleanly, and open a PR with screenshots and checklist filled.",
        details: [
          "Run ruff check . and black .",
          "Push to your fork: git push origin feat/gemma2-json-recipe",
          "Open Pull Request against the main branch with the PR template fully completed."
        ],
        keyFiles: [".github/pull_request_template.md"],
        commandToRun: "ruff check . && git push origin feat/gemma2-json-recipe",
        proTip: "Tag the issue number in the PR description (e.g., 'Fixes #142') so GitHub links them automatically."
      }
    ]
  },
  "pmndrs-zustand": {
    repositoryId: "pmndrs-zustand",
    repositoryName: "pmndrs/zustand",
    estimatedTimeToFirstPR: "2 - 4 hours",
    prerequisites: ["Node.js 18+", "pnpm", "React basics & TypeScript"],
    steps: [
      {
        stepNumber: 1,
        category: "Environment",
        title: "Fork & Install with pnpm",
        summary: "Zustand uses pnpm workspaces and strict TypeScript configs.",
        details: [
          "Fork pmndrs/zustand and clone locally.",
          "Run pnpm install to install dependencies.",
          "Run pnpm test to ensure all 200+ unit tests pass on your machine."
        ],
        keyFiles: ["package.json", "pnpm-lock.yaml", "tsconfig.json"],
        commandToRun: "pnpm install && pnpm test",
        proTip: "Ensure you are using pnpm v9+ to match maintainer lockfile specifications."
      },
      {
        stepNumber: 2,
        category: "Architecture",
        title: "Explore Core Store Implementation",
        summary: "Read src/vanilla.ts and src/react.ts. Zustand is famous for being under 2KB of pure magic.",
        details: [
          "src/vanilla.ts contains createStore, setState, getState, and subscribe.",
          "src/react.ts wraps vanilla store using useSyncExternalStore from React 18.",
          "src/middleware/ contains devtools, persist, and immer integrations."
        ],
        keyFiles: ["src/vanilla.ts", "src/react.ts", "src/middleware/persist.ts"],
        proTip: "Read the comments inside vanilla.ts; it explains listener set management in just 60 lines!"
      },
      {
        stepNumber: 3,
        category: "Issue Selection",
        title: "Pick Documentation or Edge Case Test",
        summary: "Best starting point is adding test cases for edge-case selectors or updating middleware documentation.",
        details: [
          "Search issues labeled 'documentation' or 'good first issue'.",
          "Check tests/ directory for existing test conventions with Vitest."
        ],
        keyFiles: ["tests/basic.test.tsx", "docs/guides/"],
        proTip: "A PR adding a clear TypeScript test case for an open bug is one of the fastest paths to merged PRs."
      },
      {
        stepNumber: 4,
        category: "Implementation",
        title: "Implement & Maintain Type Strictness",
        summary: "Make your edits without breaking backward compatibility or runtime bundle size.",
        details: [
          "Write your changes in TypeScript.",
          "Run pnpm check to verify strict typecheck.",
          "Verify size-limit: pnpm size"
        ],
        keyFiles: ["src/", "tests/"],
        commandToRun: "pnpm check && pnpm test",
        proTip: "Zustand has strict size limits — avoid adding external runtime dependencies."
      },
      {
        stepNumber: 5,
        category: "Testing & PR",
        title: "Verify CI & Submit Pull Request",
        summary: "Ensure lint, typecheck, tests, and build all pass before submitting.",
        details: [
          "Run pnpm lint && pnpm test.",
          "Commit using Conventional Commits: git commit -m 'docs: clarify useShallow with arrays'",
          "Submit PR and link corresponding issue."
        ],
        keyFiles: [".github/workflows/"],
        commandToRun: "pnpm lint && pnpm test",
        proTip: "Maintainers usually review within 24 hours. Be ready to iterate on feedback gracefully."
      }
    ]
  }
};

// Fallback generator for other repos
export function getOrCreateRoadmap(repo: Repository): ContributionRoadmap {
  if (MOCK_ROADMAPS[repo.id]) {
    return MOCK_ROADMAPS[repo.id];
  }

  return {
    repositoryId: repo.id,
    repositoryName: repo.fullName,
    estimatedTimeToFirstPR: "3 - 6 hours",
    prerequisites: [`Proficiency in ${repo.primaryLanguage}`, "Git & GitHub CLI", "Docker or local runtime"],
    steps: [
      {
        stepNumber: 1,
        category: "Environment",
        title: `Setup Local Development Environment for ${repo.name}`,
        summary: "Clone your fork, configure dependencies, and verify existing test suites run cleanly.",
        details: [
          `Fork ${repo.fullName} to your GitHub profile.`,
          `Clone locally: git clone ${repo.url}.git`,
          `Run setup command: ${repo.setupCommand || "npm install && npm test"}`,
          "Ensure baseline checks pass before modifying any code."
        ],
        keyFiles: ["README.md", "CONTRIBUTING.md"],
        commandToRun: repo.setupCommand || "npm install && npm test",
        proTip: "Check CONTRIBUTING.md for required Node/Python/Go version constraints before debugging environment errors."
      },
      {
        stepNumber: 2,
        category: "Architecture",
        title: "Explore Core Directory Structure & Module Boundaries",
        summary: "Trace how data flows from user input/APIs down to internal storage and render engines.",
        details: [
          "Locate the entry point in package configuration or main function.",
          "Map public API exports to internal packages/modules.",
          "Review existing test fixtures to understand real-world usage patterns."
        ],
        keyFiles: ["src/", "packages/", "tests/"],
        proTip: "Use Orbit AI to ask: 'Explain the architecture and key directories of this repository'."
      },
      {
        stepNumber: 3,
        category: "Issue Selection",
        title: "Identify & Claim a Contributor-Friendly Issue",
        summary: `Select from the ${repo.goodFirstIssuesCount} active beginner-friendly issues or propose a small fix.`,
        details: [
          "Filter repository issues by 'good first issue' or 'help wanted'.",
          "Read previous discussions to see if maintainers already agreed on an approach.",
          "Leave a concise comment asking maintainers to assign or acknowledge your plan."
        ],
        keyFiles: [".github/ISSUE_TEMPLATE/"],
        proTip: "Don't tackle massive refactors on your first PR; focus on clear, localized improvements."
      },
      {
        stepNumber: 4,
        category: "Implementation",
        title: "Code Solution on a Focused Feature Branch",
        summary: "Implement your changes while preserving existing style guides and test suites.",
        details: [
          "Create a branch: git checkout -b fix/issue-description",
          "Write targeted unit or integration tests for your change.",
          "Keep changes scoped strictly to the issue topic."
        ],
        keyFiles: ["tests/", "src/"],
        proTip: "Keep commits atomic so maintainers can follow your logical progression easily."
      },
      {
        stepNumber: 5,
        category: "Testing & PR",
        title: "Validate Tests, Check Linters & Open Pull Request",
        summary: "Complete pre-commit checks, write a respectful PR description, and track CI status.",
        details: [
          "Run full test suite locally.",
          "Push branch to your fork.",
          "Fill out the pull request template with before/after evidence or reproduction steps."
        ],
        keyFiles: [".github/pull_request_template.md"],
        commandToRun: "git push origin head",
        proTip: `Average review time for ${repo.name} is ${repo.maintainerMetrics.medianReviewTime}. Be patient and receptive to reviews!`
      }
    ]
  };
}

export const GIT_CURRICULUM: GitCurriculumTopic[] = [
  {
    id: "git-init-clone",
    title: "1. Foundations: Init, Clone & Configuration",
    summary: "Establish your local identity, clone remote repositories securely, and understand the .git folder.",
    commandSnippet: "git config --global user.name \"Your Name\"\ngit config --global user.email \"your@email.com\"\ngit clone https://github.com/owner/repo.git",
    realWorldScenario: "Joining a new team or starting your first open-source contribution.",
    steps: [
      "Configure global user name and email matching your GitHub profile.",
      "Clone remote repositories via HTTPS or SSH.",
      "Inspect the three Git areas: Working Directory, Staging Area (Index), and Repository (HEAD)."
    ],
    commonGotcha: "Committing with an unverified email makes your GitHub contribution graph miss your commits!",
    videoResource: {
      id: "git-v1",
      title: "Git Tutorial for Beginners: Learn Git in 15 Minutes",
      channel: "Fireship",
      duration: "11 mins",
      url: "https://www.youtube.com/watch?v=hwP7Mww477A"
    },
    docUrl: "https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup"
  },
  {
    id: "git-branching",
    title: "2. Branching & Isolation: Never Work on Main",
    summary: "Create, switch, and manage independent feature branches so your production work remains clean.",
    commandSnippet: "git checkout -b feat/my-feature\n# Or modern Git:\ngit switch -c feat/my-feature\ngit branch -a",
    realWorldScenario: "Working on a bug fix while your teammate updates the navigation bar.",
    steps: [
      "Always start new work from the latest upstream main branch.",
      "Name branches descriptively: 'feat/user-auth', 'fix/nav-dropdown', 'docs/readme-typo'.",
      "Switch between branches cleanly without dirty working tree conflicts."
    ],
    commonGotcha: "Switching branches with unstaged file modifications can cause merge conflicts or lost work.",
    videoResource: {
      id: "git-v2",
      title: "Git Branching Tutorial: How to Master Branches & Merging",
      channel: "Traversy Media",
      duration: "18 mins",
      url: "https://www.youtube.com/watch?v=qv7pwhkeq6g"
    },
    docUrl: "https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging"
  },
  {
    id: "git-commit-discipline",
    title: "3. Crafting Atomic Commits & Staging",
    summary: "Use selective staging with git add -p to create clean, reviewable, single-purpose commits.",
    commandSnippet: "git status -s\ngit add -p\ngit commit -m \"fix(auth): handle expired token redirect correctly\"",
    realWorldScenario: "You edited 5 files, but 3 are part of a bugfix and 2 are documentation formatting.",
    steps: [
      "Use 'git add -p' to review patch hunks interactively before staging.",
      "Follow Conventional Commits: feat:, fix:, refactor:, docs:, test:.",
      "Write commit messages in imperative mood: 'Add feature', not 'Added feature'."
    ],
    commonGotcha: "Running 'git add .' blindly often stages unintended files like .env or local config.",
    videoResource: {
      id: "git-v3",
      title: "How to Write Good Git Commit Messages",
      channel: "Web Dev Simplified",
      duration: "9 mins",
      url: "https://www.youtube.com/watch?v=HglBM2tA89U"
    },
    docUrl: "https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository"
  },
  {
    id: "git-sync-rebase",
    title: "4. Keeping Upstream Synced: Rebase vs Merge",
    summary: "Sync your working branch with maintainer changes using linear rebase to avoid messy merge bubbles.",
    commandSnippet: "git remote add upstream https://github.com/original-owner/repo.git\ngit fetch upstream\ngit rebase upstream/main",
    realWorldScenario: "While you worked on your PR for 3 days, 15 other PRs were merged into main.",
    steps: [
      "Add the original project as a remote named 'upstream'.",
      "Fetch upstream branches without polluting your local tree.",
      "Rebase your feature commits on top of current upstream/main."
    ],
    commonGotcha: "Never rebase commits that have already been pushed to a public shared branch used by others.",
    videoResource: {
      id: "git-v4",
      title: "Git Rebase vs Merge Explained",
      channel: "CS Dojo",
      duration: "12 mins",
      url: "https://www.youtube.com/watch?v=0chZFIZLR_0"
    },
    docUrl: "https://git-scm.com/book/en/v2/Git-Branching-Rebasing"
  },
  {
    id: "git-conflict-resolution",
    title: "5. Calm Conflict Resolution",
    summary: "Resolve merge and rebase conflicts methodically using diff markers and editor tools.",
    commandSnippet: "# During merge/rebase conflict:\ngit status\n# Edit conflict markers (<<<<<<<, =======, >>>>>>>)\ngit add resolved-file.ts\ngit rebase --continue",
    realWorldScenario: "Two developers modified the same export line in index.ts.",
    steps: [
      "Identify the conflicting files marked by Git.",
      "Inspect the conflict markers: <<<<<<< (current) vs >>>>>>> (incoming).",
      "Choose the combined correct logic, save, and stage the resolved files.",
      "Run 'git rebase --continue' or 'git commit' to complete the resolution."
    ],
    commonGotcha: "Forgetting to remove conflict marker strings before committing will break your build!",
    videoResource: {
      id: "git-v5",
      title: "How to Resolve Git Merge Conflicts with Ease",
      channel: "The Net Ninja",
      duration: "10 mins",
      url: "https://www.youtube.com/watch?v=xN1-2p06U3M"
    },
    docUrl: "https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging#_basic_merge_conflicts"
  },
  {
    id: "git-pr-contribution",
    title: "6. The Perfect GitHub Pull Request",
    summary: "Push your branch, open a well-documented PR, respond to code reviews, and update PR commits.",
    commandSnippet: "git push origin feat/my-feature\n# If you amended commits after rebase:\ngit push --force-with-lease origin feat/my-feature",
    realWorldScenario: "Submitting your contribution to an open-source maintainer team.",
    steps: [
      "Push your branch to your personal fork on GitHub.",
      "Open a Pull Request with clear description, context, and issue references.",
      "Address maintainer review feedback by adding commits or amending.",
      "Celebrate when the purple 'Merged' badge appears!"
    ],
    commonGotcha: "Using 'git push --force' instead of '--force-with-lease' can overwrite teammate commits on shared branches.",
    videoResource: {
      id: "git-v6",
      title: "How to Make Your First Pull Request on GitHub",
      channel: "freeCodeCamp.org",
      duration: "14 mins",
      url: "https://www.youtube.com/watch?v=rgbCcBNZcdQ"
    },
    docUrl: "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests"
  }
];

export const MOCK_LANGUAGE_PATHS: Record<string, LearningPath> = {
  python: {
    subject: "Python",
    title: "Modern Python for Open Source & AI Engineering",
    tagline: "From language idioms to PyTorch, FastAPI, and open-weight Gemma integration.",
    description: "Master Python syntax, type hints, asynchronous concurrency, virtual environments, and package publishing.",
    level: "All Levels (Beginner to Intermediate)",
    prerequisites: ["None required. Basic computer literacy."],
    stages: [
      {
        id: "py-s1",
        stageNumber: 1,
        title: "Python Fundamentals & Modern Idioms",
        summary: "Syntax, data types, list comprehensions, generators, and type annotations (PEP 484).",
        concepts: ["Dynamic typing vs Type annotations", "List/dict/set comprehensions", "Context managers ('with' statements)", "Exception handling hierarchy"],
        keyTakeaways: [
          "Always use modern type annotations (def fn(x: int) -> str) for maintainable code.",
          "Use virtual environments (venv, uv, or poetry) for every project."
        ],
        estimatedHours: "8 - 10 hours",
        videos: [
          {
            id: "py-v1",
            title: "Python 100 Days of Code: Core Fundamentals",
            channel: "Corey Schafer",
            duration: "32 mins",
            url: "https://www.youtube.com/watch?v=YYXdXT2l-Gg"
          },
          {
            id: "py-v2",
            title: "Python Type Hints & Annotations Tutorial",
            channel: "ArjanCodes",
            duration: "16 mins",
            url: "https://www.youtube.com/watch?v=QORvB-_mbZ0"
          }
        ],
        websites: [
          {
            title: "Official Python Documentation & Tutorial",
            domain: "docs.python.org",
            url: "https://docs.python.org/3/tutorial/",
            description: "The authoritative and comprehensive guide straight from the Python Software Foundation.",
            type: "Official Docs"
          },
          {
            title: "Real Python: Intermediate & Advanced Guides",
            domain: "realpython.com",
            url: "https://realpython.com/",
            description: "High quality, peer-reviewed tutorials covering real-world Python workflows.",
            type: "Guide"
          }
        ]
      },
      {
        id: "py-s2",
        stageNumber: 2,
        title: "Object-Oriented Design & Data Modeling",
        summary: "Classes, dataclasses, Pydantic v2 schemas, and protocol-based duck typing.",
        concepts: ["Dataclasses vs standard classes", "Pydantic v2 serialization & validation", "Dunder methods (__repr__, __call__, __enter__)", "Abstract Base Classes (abc) & Protocols"],
        keyTakeaways: [
          "Pydantic is the standard data modeling library for modern APIs and AI outputs.",
          "Prefer composition over deep inheritance trees."
        ],
        estimatedHours: "10 - 12 hours",
        videos: [
          {
            id: "py-v3",
            title: "Pydantic V2 Crash Course: Data Validation in Python",
            channel: "Amigoscode",
            duration: "25 mins",
            url: "https://www.youtube.com/watch?v=d_2eI-W_fM0"
          }
        ],
        websites: [
          {
            title: "Pydantic Documentation",
            domain: "docs.pydantic.dev",
            url: "https://docs.pydantic.dev/latest/",
            description: "Fast data validation using Python type hints, powered by Rust under the hood.",
            type: "Official Docs"
          }
        ]
      },
      {
        id: "py-s3",
        stageNumber: 3,
        title: "AsyncIO, Web Services & Open-Weight AI (Gemma)",
        summary: "Asynchronous programming with async/await, building REST APIs with FastAPI, and running local Gemma models.",
        concepts: ["Event loop, coroutines, and tasks", "FastAPI dependency injection & streaming", "Calling Gemma via Ollama Python client", "Structured JSON extraction from LLMs"],
        keyTakeaways: [
          "AsyncIO prevents blocking I/O when streaming model completions.",
          "Gemma can be loaded directly through Ollama or Hugging Face transformers."
        ],
        estimatedHours: "12 - 16 hours",
        videos: [
          {
            id: "py-v4",
            title: "FastAPI Complete Tutorial with Async Python",
            channel: "freeCodeCamp.org",
            duration: "45 mins",
            url: "https://www.youtube.com/watch?v=0sOvCWFmrtA"
          },
          {
            id: "py-v5",
            title: "Run Google Gemma 2 Locally with Python & Ollama",
            channel: "Prompt Engineering",
            duration: "14 mins",
            url: "https://www.youtube.com/watch?v=O8W-i6m9k9M"
          }
        ],
        websites: [
          {
            title: "FastAPI Official Documentation",
            domain: "fastapi.tiangolo.com",
            url: "https://fastapi.tiangolo.com/",
            description: "Modern, fast (high-performance) web framework for building APIs with Python 3.8+.",
            type: "Official Docs"
          },
          {
            title: "Google Gemma Official Model Documentation",
            domain: "ai.google.dev",
            url: "https://ai.google.dev/gemma",
            description: "Technical specifications, model cards, and guides for the Gemma open-weight family.",
            type: "Official Docs"
          }
        ]
      }
    ]
  },
  typescript: {
    subject: "TypeScript",
    title: "TypeScript for Scalable Full-Stack & Open Source",
    tagline: "Type safety, generics, utility types, and modern React 19 / Node patterns.",
    description: "Transition from loose JavaScript to bulletproof TypeScript architectures that open-source maintainers love.",
    level: "Intermediate",
    prerequisites: ["Basic JavaScript proficiency (ES6 syntax)"],
    stages: [
      {
        id: "ts-s1",
        stageNumber: 1,
        title: "Type System Foundations & Narrowing",
        summary: "Primitive types, interfaces vs type aliases, unions, and type guards.",
        concepts: ["Structural typing (duck typing)", "Discriminated unions", "Type narrowing with typeof and instanceof", "Strict null checks"],
        keyTakeaways: [
          "Discriminated unions make invalid states unrepresentable in UI logic.",
          "Enable strict mode in tsconfig.json from day one."
        ],
        estimatedHours: "6 - 8 hours",
        videos: [
          {
            id: "ts-v1",
            title: "TypeScript Crash Course: Fundamentals to Advanced",
            channel: "Jack Herrington",
            duration: "38 mins",
            url: "https://www.youtube.com/watch?v=bc5uhfv5g2o"
          }
        ],
        websites: [
          {
            title: "TypeScript Handbook",
            domain: "www.typescriptlang.org",
            url: "https://www.typescriptlang.org/docs/handbook/intro.html",
            description: "The official guide to learning TypeScript systematically.",
            type: "Official Docs"
          }
        ]
      },
      {
        id: "ts-s2",
        stageNumber: 2,
        title: "Generics, Utility Types & Type Manipulation",
        summary: "Creating reusable, flexible components with generic constraints and conditional types.",
        concepts: ["Generic functions & classes", "keyof, typeof, and mapped types", "Built-in utilities: Record, Partial, Pick, Omit", "Conditional types and 'infer'"],
        keyTakeaways: [
          "Generics capture input types rather than enforcing a static contract.",
          "Use generics in API service wrappers to strongly type HTTP responses."
        ],
        estimatedHours: "8 - 10 hours",
        videos: [
          {
            id: "ts-v2",
            title: "Generics in TypeScript Explained",
            channel: "Matt Pocock (Total TypeScript)",
            duration: "12 mins",
            url: "https://www.youtube.com/watch?v=dLPgQRbVquo"
          }
        ],
        websites: [
          {
            title: "Total TypeScript Tutorials & Tips",
            domain: "totaltypescript.com",
            url: "https://www.totaltypescript.com/tutorials",
            description: "Interactive, bite-sized lessons by Matt Pocock on advanced TypeScript patterns.",
            type: "Interactive Tutorial"
          }
        ]
      },
      {
        id: "ts-s3",
        stageNumber: 3,
        title: "Full-Stack TypeScript & Open Source Library Design",
        summary: "Packaging npm libraries, bundling with tsup/esbuild, and publishing type declarations.",
        concepts: ["d.ts declaration files", "Publishing dual ESM and CJS packages", "Testing with Vitest", "Writing type-safe API clients with fetch and Zod"],
        keyTakeaways: [
          "Validate external data at runtime boundaries with Zod; TypeScript types vanish at runtime.",
          "Keep dependencies minimal to maintain high download popularity."
        ],
        estimatedHours: "10 - 12 hours",
        videos: [
          {
            id: "ts-v3",
            title: "How to Build and Publish a Modern TypeScript npm Package",
            channel: "James Perkins",
            duration: "21 mins",
            url: "https://www.youtube.com/watch?v=3y8s7eW_R8Y"
          }
        ],
        websites: [
          {
            title: "Zod: TypeScript-First Schema Validation",
            domain: "zod.dev",
            url: "https://zod.dev/",
            description: "Static type inference and runtime validation for clean API boundaries.",
            type: "Official Docs"
          }
        ]
      }
    ]
  },
  go: {
    subject: "Go",
    title: "Go (Golang) for High-Performance Systems & Cloud",
    tagline: "Concurrency with Goroutines, clean interfaces, and cloud-native tool building.",
    description: "Learn why Docker, Kubernetes, Terraform, and Ollama are all written in Go.",
    level: "Intermediate",
    prerequisites: ["Basic programming experience in any language"],
    stages: [
      {
        id: "go-s1",
        stageNumber: 1,
        title: "Go Syntax, Structs & Pointers",
        summary: "Fast compilation, explicit error handling, structs, and memory pointers.",
        concepts: ["Values vs Pointers", "Explicit error handling (if err != nil)", "Structs, methods, and receiver types", "Packages and go.mod modules"],
        keyTakeaways: [
          "Go favors simplicity and readability over clever metaprogramming.",
          "Errors are ordinary values in Go, not thrown exceptions."
        ],
        estimatedHours: "6 - 8 hours",
        videos: [
          {
            id: "go-v1",
            title: "Go Programming by Example",
            channel: "freeCodeCamp.org",
            duration: "35 mins",
            url: "https://www.youtube.com/watch?v=YS4e4q9oBaU"
          }
        ],
        websites: [
          {
            title: "A Tour of Go",
            domain: "go.dev",
            url: "https://go.dev/tour/",
            description: "Interactive online tour covering all basic and advanced Go features.",
            type: "Interactive Tutorial"
          }
        ]
      },
      {
        id: "go-s2",
        stageNumber: 2,
        title: "Goroutines, Channels & Concurrency",
        summary: "Lightweight concurrent routines, channels, select statements, and sync primitives.",
        concepts: ["Goroutines vs OS threads", "Buffered vs Unbuffered channels", "Select statement & timeout patterns", "sync.WaitGroup and sync.Mutex"],
        keyTakeaways: [
          "Do not communicate by sharing memory; instead, share memory by communicating.",
          "Always handle goroutine lifecycle to prevent memory leaks."
        ],
        estimatedHours: "10 - 12 hours",
        videos: [
          {
            id: "go-v2",
            title: "Golang Concurrency: Goroutines & Channels Explained",
            channel: "TechWorld with Nana",
            duration: "24 mins",
            url: "https://www.youtube.com/watch?v=yyUHQIec83I"
          }
        ],
        websites: [
          {
            title: "Effective Go",
            domain: "go.dev",
            url: "https://go.dev/doc/effective_go",
            description: "Tips for writing clear, idiomatic Go code directly from the Go authors.",
            type: "Guide"
          }
        ]
      }
    ]
  },
  rust: {
    subject: "Rust",
    title: "Rust for Reliable, Blazing-Fast Systems",
    tagline: "Memory safety without garbage collection, borrow checker, and zero-cost abstractions.",
    description: "Build robust low-level CLI utilities, WebAssembly modules, and AI inference engines.",
    level: "Challenging",
    prerequisites: ["Understanding of memory, pointers, or C/C++ is helpful"],
    stages: [
      {
        id: "rs-s1",
        stageNumber: 1,
        title: "Ownership, Borrowing & Lifetimes",
        summary: "The heart of Rust: how the compiler guarantees memory safety at compile time.",
        concepts: ["Move semantics vs Copy trait", "Immutable vs Mutable references (& vs &mut)", "The Borrow Checker rules", "RAII (Resource Acquisition Is Initialization)"],
        keyTakeaways: [
          "You can have any number of immutable references OR exactly one mutable reference, never both.",
          "The compiler is your strict pair programmer."
        ],
        estimatedHours: "12 - 16 hours",
        videos: [
          {
            id: "rs-v1",
            title: "Rust Crash Course | Memory Management & Ownership",
            channel: "Traversy Media",
            duration: "40 mins",
            url: "https://www.youtube.com/watch?v=zF34dRivLOw"
          }
        ],
        websites: [
          {
            title: "The Rust Programming Language Book",
            domain: "doc.rust-lang.org",
            url: "https://doc.rust-lang.org/book/",
            description: "The definitive guide to learning Rust from scratch.",
            type: "Official Docs"
          }
        ]
      }
    ]
  }
};

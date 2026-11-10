import { Repository, ContributionRoadmap, LearningPath, GitCurriculumTopic, ChatMessage, UserProfile } from "../types";
import { MOCK_REPOSITORIES, getOrCreateRoadmap, GIT_CURRICULUM, MOCK_LANGUAGE_PATHS } from "../data/mockData";
import { PYTHON_COURSE } from "../data/pythonCourse";
import { track } from "./track";

export interface ApiStatus {
  isLive: boolean;
  baseUrl: string;
  lastChecked: string;
  error?: string;
}

class OrbitApiService {
  private baseUrl: string;
  private preferMock: boolean = false;

  constructor() {
    // Reads from environment variable or falls back to same-origin /api
    this.baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "/api";
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, "");
  }

  public setPreferMock(val: boolean) {
    this.preferMock = val;
  }

  public isPreferMock(): boolean {
    return this.preferMock;
  }

  /**
   * Health check to see if live backend is online
   */
  public async checkHealth(): Promise<ApiStatus> {
    if (this.preferMock) {
      return {
        isLive: false,
        baseUrl: this.baseUrl,
        lastChecked: new Date().toISOString(),
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return {
          isLive: true,
          baseUrl: this.baseUrl,
          lastChecked: new Date().toISOString(),
        };
      }
      return {
        isLive: false,
        baseUrl: this.baseUrl,
        lastChecked: new Date().toISOString(),
        error: `HTTP ${res.status}`,
      };
    } catch (err: any) {
      return {
        isLive: false,
        baseUrl: this.baseUrl,
        lastChecked: new Date().toISOString(),
        error: err.name === "AbortError" ? "Timeout" : "Unreachable",
      };
    }
  }

  /**
   * Fetch repository recommendations based on user skills & experience
   */
  public async getRepositories(profile?: UserProfile, signal?: AbortSignal, force = false, page = 1): Promise<{ data: Repository[]; isMock: boolean }> {
    if (!this.preferMock) {
      const queryParams = new URLSearchParams();
      if (profile?.skills?.length) queryParams.set("skills", profile.skills.join(","));
      if (profile?.experienceLevel) queryParams.set("experience", profile.experienceLevel);
      queryParams.set("limit", "24");
      if (page > 1) queryParams.set("page", String(page));
      const url = `${this.baseUrl}/repositories?${queryParams.toString()}`;
      const cacheKey = `reporbit_repos:${queryParams.toString()}`;
      const load = async () => {
        const res = await fetch(url, { signal, credentials: "include" });
        if (!res.ok) return null;
        const json = await res.json();
        const data = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : null;
        if (data && data.length) { try { localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), data })); } catch { /* quota */ } }
        return data;
      };
      // Instant first paint from the last result (≤30 min old), refreshed in the background.
      try {
        const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
        if (!force && cached && Date.now() - cached.at < 30 * 60e3 && Array.isArray(cached.data) && cached.data.length) {
          load().catch(() => {});
          return { data: cached.data, isMock: false };
        }
      } catch { /* ignore */ }
      try {
        const data = await load();
        if (data && data.length) return { data, isMock: false };
      } catch (err: any) {
        if (err.name === "AbortError") throw err;
      }
    }

    // Filter mock repositories by profile if present
    let repos = [...MOCK_REPOSITORIES];
    if (profile) {
      if (profile.preferredDifficulty && profile.preferredDifficulty !== "All") {
        repos = repos.filter((r) => r.difficulty === profile.preferredDifficulty);
      }
      if (profile.skills && profile.skills.length > 0) {
        // Boost match scores for repos that share skills
        repos = repos.map((r) => {
          const overlaps = r.languages.filter((l) =>
            profile.skills.some((s) => s.toLowerCase() === l.toLowerCase())
          );
          const boostedScore = Math.min(99, r.matchScore + overlaps.length * 2);
          return {
            ...r,
            matchScore: boostedScore,
            matchedSkills: overlaps.length > 0 ? overlaps : r.matchedSkills,
          };
        });
        repos.sort((a, b) => b.matchScore - a.matchScore);
      }
    }

    return { data: repos, isMock: true };
  }

  /**
   * Fetch step-by-step contribution roadmap for a specific repository
   */
  public async getContributionRoadmap(repoId: string, signal?: AbortSignal): Promise<{ data: ContributionRoadmap; isMock: boolean }> {
    if (!this.preferMock) {
      try {
        const res = await fetch(`${this.baseUrl}/repositories/${repoId}/roadmap`, { signal, credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          if (json.steps) {
            return { data: json, isMock: false };
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") throw err;
      }
    }

    const repo = MOCK_REPOSITORIES.find((r) => r.id === repoId) || MOCK_REPOSITORIES[0];
    const roadmap = getOrCreateRoadmap(repo);
    return { data: roadmap, isMock: true };
  }

  /**
   * Fetch Git curriculum
   */
  public async getGitCurriculum(signal?: AbortSignal): Promise<{ data: GitCurriculumTopic[]; isMock: boolean }> {
    if (!this.preferMock) {
      try {
        const res = await fetch(`${this.baseUrl}/learn/git`, { signal });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            return { data: json, isMock: false };
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") throw err;
      }
    }

    return { data: GIT_CURRICULUM, isMock: true };
  }

  /**
   * Fetch language learning roadmap and resources
   */
  public async getLanguageRoadmap(subject: string, signal?: AbortSignal): Promise<{ data: LearningPath | null; isMock: boolean }> {
    const key = subject.trim().toLowerCase();
    track.topic(subject);

    if (!this.preferMock) {
      try {
        const res = await fetch(`${this.baseUrl}/learn/languages?subject=${encodeURIComponent(key)}`, { signal });
        if (res.ok) {
          const json = await res.json();
          if (json.stages) {
            return { data: json, isMock: false };
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") throw err;
      }
    }

    const matched = key === "python" ? PYTHON_COURSE : MOCK_LANGUAGE_PATHS[key];
    if (matched) {
      return { data: matched, isMock: true };
    }

    // Default dynamic mock path if user searched for another subject
    const dynamicPath: LearningPath = {
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      title: `${subject.toUpperCase()} Core & Open Source Ecosystem`,
      tagline: `Fundamentals, idiomatic patterns, and contribution practices for ${subject}.`,
      description: `Structured curriculum tailored to build real-world proficiency in ${subject} with community tutorials and official documentation.`,
      level: "Beginner to Intermediate",
      prerequisites: ["General programming concepts"],
      stages: [
        {
          id: `${key}-s1`,
          stageNumber: 1,
          title: `Foundations of ${subject}`,
          summary: `Environment setup, core syntax, control flow, and standard libraries.`,
          concepts: ["Runtime installation", "Syntax basics", "Data types & functions", "Package manager setup"],
          keyTakeaways: [`Understand the basic execution model of ${subject}.`],
          estimatedHours: "6 - 8 hours",
          videos: [
            {
              id: `${key}-v1`,
              title: `${subject} Tutorial for Beginners: Full Course`,
              channel: "freeCodeCamp.org",
              duration: "45 mins",
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + " tutorial")}`,
            },
          ],
          websites: [
            {
              title: `${subject} Official Documentation`,
              domain: `${key}.org`,
              url: `https://duckduckgo.com/?q=${encodeURIComponent(subject + " official documentation")}`,
              description: `Official documentation and guides for ${subject}.`,
              type: "Official Docs",
            },
          ],
        },
        {
          id: `${key}-s2`,
          stageNumber: 2,
          title: `Advanced Architecture & Testing in ${subject}`,
          summary: `Modular design, automated unit testing, and contributing to open-source libraries.`,
          concepts: ["Modular packages", "Unit testing framework", "CI/CD integration", "Performance considerations"],
          keyTakeaways: ["Write testable and maintainable code that passes automated checks."],
          estimatedHours: "8 - 12 hours",
          videos: [
            {
              id: `${key}-v2`,
              title: `Building Production Applications in ${subject}`,
              channel: "Traversy Media",
              duration: "30 mins",
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + " advanced course")}`,
            },
          ],
          websites: [
            {
              title: `Awesome ${subject} Curated Resources`,
              domain: "github.com",
              url: `https://github.com/sindresorhus/awesome`,
              description: "Curated lists of awesome libraries, tools, and tutorials.",
              type: "Guide",
            },
          ],
        },
      ],
    };

    return { data: dynamicPath, isMock: true };
  }

  /**
   * Send chat message to Orbit AI (served by the backend).
   * There is deliberately NO canned/mock AI reply: if the model or the backend is unreachable we say so.
   */
  public async sendChatMessage(
    messages: { role: string; content: string }[],
    repoContext?: { id: string; name: string; owner: string },
    signal?: AbortSignal
  ): Promise<{ message: string; model: string; isMock: boolean }> {
    try {
      const res = await fetch(`${this.baseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messages, repoContext }),
        signal,
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.response) {
        return { message: json.response, model: json.model || "Orbit AI", isMock: false };
      }
      const msg = json?.error?.message || `HTTP ${res.status}`;
      return { message: `⚠️ **Orbit AI could not answer** — ${msg}. This is not an AI response.`, model: "Orbit AI (offline)", isMock: false };
    } catch (err: any) {
      if (err.name === "AbortError") throw err;
      return {
        message: "⚠️ **The Reporbit server is not reachable**, so Orbit AI cannot answer right now. Start the backend (`npm start`) and try again. This is not an AI response.",
        model: "Orbit AI (offline)",
        isMock: false,
      };
    }
  }
}

export const apiService = new OrbitApiService();

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, Repository, ChatSession, ChatMessage } from "../types";
import { apiService, ApiStatus } from "../services/api";
import { useAuth } from "./AuthContext";
import { track } from "../services/track";

export type NavTab = "repositories" | "learn" | "chat" | "pr" | "profile";

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  selectedRepo: Repository | null;
  setSelectedRepo: (repo: Repository | null) => void;
  isRoadmapOpen: boolean;
  setIsRoadmapOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isFloatingChatOpen: boolean;
  setIsFloatingChatOpen: (open: boolean) => void;
  chatSessions: ChatSession[];
  activeSessionId: string;
  createChatSession: (repoContext?: { id: string; name: string; owner: string }) => string;
  setActiveSessionId: (id: string) => void;
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
  openChatWithRepo: (repo: Repository) => void;
  openRoadmapForRepo: (repo: Repository) => void;
  deleteChatSession: (id: string) => void;
  // Open Orbit AI (optionally connected to a repo) and optionally send a prompt automatically.
  askOrbit: (prompt?: string | null, repoContext?: { id: string; name: string; owner: string } | null) => void;
  pendingPrompt: { sessionId: string; text: string } | null;
  clearPendingPrompt: () => void;
  contributedRepos: Set<string>; // lower-case "owner/name" from the user's real GitHub activity
  refreshContributedRepos: () => void;
  toast: { id: number; text: string; tone?: "success" | "info" | "error" } | null;
  showToast: (text: string, tone?: "success" | "info" | "error") => void;
  apiStatus: ApiStatus;
  refreshApiStatus: () => Promise<void>;
  isMockMode: boolean;
  toggleMockMode: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Developer",
  skills: ["JavaScript", "Python"],
  experienceLevel: "Beginner",
  interests: ["Web", "Open Source", "AI/ML"],
  preferredDifficulty: "All",
};

const INITIAL_MESSAGE: ChatMessage = {
  id: "msg-welcome",
  role: "assistant",
  content: "Hey! 👋 I'm **Orbit AI**, your Reporbit mentor.\n\nAsk me anything — casual or technical. I can explain a repository, walk you through Git, help debug, or plan your first pull request. What's on your mind?",
  timestamp: new Date().toISOString(),
  model: "Orbit AI",
};

const DEFAULT_SESSION: ChatSession = {
  id: "session-default",
  title: "Welcome to Orbit AI",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [INITIAL_MESSAGE],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTabState] = useState<NavTab>(() => {
    const hash = window.location.hash.replace("#", "").split("?")[0] as NavTab;
    if (["repositories", "learn", "chat", "pr", "profile"].includes(hash)) {
      return hash;
    }
    return "repositories";
  });

  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };

  // Sync hash on popstate (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "").split("?")[0] as NavTab;
      if (["repositories", "learn", "chat", "pr", "profile"].includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener("popstate", handleHashChange);
    return () => window.removeEventListener("popstate", handleHashChange);
  }, []);

  // Profile: comes from the signed-in user's saved profile (database), not hard-coded defaults.
  const auth = useAuth();
  const toLevel = (e?: string | null): UserProfile["experienceLevel"] =>
    e === "advanced" ? "Advanced" : e === "intermediate" ? "Intermediate" : "Beginner";
  const fromServer = (): UserProfile => ({
    name: auth.user?.displayName || DEFAULT_PROFILE.name,
    skills: auth.profile?.skills?.length ? auth.profile.skills : DEFAULT_PROFILE.skills,
    experienceLevel: toLevel(auth.profile?.experience),
    interests: auth.profile?.interests?.length ? auth.profile.interests : DEFAULT_PROFILE.interests,
    preferredDifficulty: (localStorage.getItem("reporbit_difficulty") as UserProfile["preferredDifficulty"]) || "All",
  });
  const [profile, setProfile] = useState<UserProfile>(fromServer);
  useEffect(() => { setProfile(fromServer()); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [auth.user?.id, auth.profile]);

  const updateProfile = (partial: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...partial }));
    if (partial.preferredDifficulty) localStorage.setItem("reporbit_difficulty", partial.preferredDifficulty);
    // Persist the parts the backend stores.
    const patch: Record<string, unknown> = {};
    if (partial.skills) patch.skills = partial.skills;
    if (partial.interests) patch.interests = partial.interests;
    if (partial.experienceLevel) patch.experience = partial.experienceLevel.toLowerCase();
    if (Object.keys(patch).length && auth.status === "authed") auth.saveProfile(patch).catch(() => {});
  };

  // Repository selection & modals
  const [selectedRepo, setSelectedRepoState] = useState<Repository | null>(null);
  const setSelectedRepo = (repo: Repository | null) => {
    if (repo && repo.id !== selectedRepo?.id) track.repo(repo, "viewed");
    setSelectedRepoState(repo);
  };
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);

  // Chat sessions
  const storeKey = `reporbit_chats:${auth.user?.id || "guest"}`;
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    try { const saved = JSON.parse(localStorage.getItem(storeKey) || "null"); if (Array.isArray(saved) && saved.length) return saved; } catch { /* ignore */ }
    return [DEFAULT_SESSION];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => chatSessions[0]?.id || "session-default");
  useEffect(() => { try { localStorage.setItem(storeKey, JSON.stringify(chatSessions.slice(0, 30))); } catch { /* quota */ } }, [chatSessions, storeKey]);

  const deleteChatSession = (id: string) => {
    setChatSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      const list = next.length ? next : [{ ...DEFAULT_SESSION, id: `session-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
      if (id === activeSessionId) setActiveSessionId(list[0].id);
      return list;
    });
  };

  const [pendingPrompt, setPendingPrompt] = useState<{ sessionId: string; text: string } | null>(null);
  const clearPendingPrompt = () => setPendingPrompt(null);

  const [toast, setToast] = useState<{ id: number; text: string; tone?: "success" | "info" | "error" } | null>(null);
  const showToast = (text: string, tone: "success" | "info" | "error" = "success") => {
    const id = Date.now(); setToast({ id, text, tone });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 4200);
  };

  const [contributedRepos, setContributedRepos] = useState<Set<string>>(new Set());
  const refreshContributedRepos = () => {
    if (auth.status !== "authed") return;
    fetch("/api/me/contributed-repos", { credentials: "include" }).then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setContributedRepos(new Set((j.items || []).map((x: any) => String(x.fullName).toLowerCase())))).catch(() => {});
  };
  useEffect(() => { refreshContributedRepos(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [auth.user?.id, auth.user?.githubLogin]);

  const createChatSession = (repoContext?: { id: string; name: string; owner: string }): string => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: repoContext ? `${repoContext.name} Discussion` : "New Conversation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      repoContext,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: repoContext
            ? `🔗 Connected to **${repoContext.owner}/${repoContext.name}**. I'll answer using this repository's own docs — no need to tell me which repo you mean. What would you like to know?`
            : "What would you like to explore? Feel free to ask about Git, code concepts, or select a repository to analyze.",
          timestamp: new Date().toISOString(),
          repoContext,
          model: "Orbit AI",
        },
      ],
    };

    setChatSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    return newId;
  };

  const addMessageToSession = (sessionId: string, message: ChatMessage) => {
    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            updatedAt: new Date().toISOString(),
            messages: [...s.messages, message],
            title:
              s.messages.length === 1 && message.role === "user"
                ? message.content.slice(0, 30) + (message.content.length > 30 ? "..." : "")
                : s.title,
          };
        }
        return s;
      })
    );
  };

  const askOrbit = (prompt?: string | null, repoContext?: { id: string; name: string; owner: string } | null) => {
    const id = createChatSession(repoContext || undefined);
    if (prompt && prompt.trim()) setPendingPrompt({ sessionId: id, text: prompt.trim() });
    setSelectedRepoState(null);
    setIsRoadmapOpen(false);
    setActiveTab("chat");
  };

  const openChatWithRepo = (repo: Repository) => {
    track.repo(repo, "chat");
    const repoCtx = { id: repo.id, name: repo.name, owner: repo.owner };
    const sessionId = createChatSession(repoCtx);
    setActiveTab("chat");
  };

  const openRoadmapForRepo = (repo: Repository) => {
    track.repo(repo, "roadmap");
    setSelectedRepo(repo);
    setIsRoadmapOpen(true);
  };

  // API Status & Mock Mode
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isLive: false,
    baseUrl: apiService.getBaseUrl(),
    lastChecked: new Date().toISOString(),
  });
  const [isMockMode, setIsMockMode] = useState(apiService.isPreferMock());

  const refreshApiStatus = async () => {
    const status = await apiService.checkHealth();
    setApiStatus(status);
  };

  const toggleMockMode = () => {
    const nextVal = !isMockMode;
    apiService.setPreferMock(nextVal);
    setIsMockMode(nextVal);
    refreshApiStatus();
  };

  useEffect(() => {
    refreshApiStatus();
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        profile,
        updateProfile,
        selectedRepo,
        setSelectedRepo,
        isRoadmapOpen,
        setIsRoadmapOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isFloatingChatOpen,
        setIsFloatingChatOpen,
        chatSessions,
        activeSessionId,
        createChatSession,
        setActiveSessionId,
        addMessageToSession,
        openChatWithRepo,
        openRoadmapForRepo,
        deleteChatSession,
        askOrbit,
        pendingPrompt,
        clearPendingPrompt,
        contributedRepos,
        refreshContributedRepos,
        toast,
        showToast,
        apiStatus,
        refreshApiStatus,
        isMockMode,
        toggleMockMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

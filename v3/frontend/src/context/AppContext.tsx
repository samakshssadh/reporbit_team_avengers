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
  content: "Hey! 👋 I'm **Orbit AI**, Reporbit's assistant, powered by Google's open-weight **Gemma** model.\n\nAsk me anything — casual or technical. I can explain a repository, walk you through Git, help debug, or plan your first pull request. What's on your mind?",
  timestamp: new Date().toISOString(),
  model: "Google Gemma (open-weight)",
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
    const hash = window.location.hash.replace("#", "") as NavTab;
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
      const hash = window.location.hash.replace("#", "") as NavTab;
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
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([DEFAULT_SESSION]);
  const [activeSessionId, setActiveSessionId] = useState<string>("session-default");

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
            ? `I have loaded **${repoContext.owner}/${repoContext.name}** into context. How can I help you understand or contribute to this repository?`
            : "What would you like to explore? Feel free to ask about Git, code concepts, or select a repository to analyze.",
          timestamp: new Date().toISOString(),
          repoContext,
          model: "Google Gemma (open-weight)",
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

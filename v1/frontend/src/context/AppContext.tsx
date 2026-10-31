import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, Repository, ChatSession, ChatMessage } from "../types";
import { apiService, ApiStatus } from "../services/api";
import { MOCK_REPOSITORIES } from "../data/mockData";

export type NavTab = "repositories" | "learn" | "chat";

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
  skills: ["TypeScript", "React", "Python"],
  experienceLevel: "Intermediate",
  interests: ["Web", "Open Source", "AI/ML"],
  preferredDifficulty: "All",
};

const INITIAL_MESSAGE: ChatMessage = {
  id: "msg-welcome",
  role: "assistant",
  content: "Hello! I am **Orbit AI**, powered by Google's open-weight **Gemma** model.\n\nI can help you explore repositories, breakdown architectures, guide your pull requests, and explain complex code. What would you like to explore?",
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
    if (["repositories", "learn", "chat"].includes(hash)) {
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
      if (["repositories", "learn", "chat"].includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener("popstate", handleHashChange);
    return () => window.removeEventListener("popstate", handleHashChange);
  }, []);

  // Profile preferences
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("orbit_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return DEFAULT_PROFILE;
  });

  const updateProfile = (partial: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...partial };
      localStorage.setItem("orbit_profile", JSON.stringify(updated));
      return updated;
    });
  };

  // Repository selection & modals
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
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
    const repoCtx = { id: repo.id, name: repo.name, owner: repo.owner };
    const sessionId = createChatSession(repoCtx);
    setActiveTab("chat");
  };

  const openRoadmapForRepo = (repo: Repository) => {
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

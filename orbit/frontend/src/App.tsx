import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/common/Header";
import { RepositoriesPage } from "./components/repositories/RepositoriesPage";
import { LearnPage } from "./components/learn/LearnPage";
import { OrbitAIChat } from "./components/chat/OrbitAIChat";
import { ProfileModal } from "./components/common/ProfileModal";
import { FloatingChatLauncher } from "./components/common/FloatingChatLauncher";

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1">
      {activeTab === "repositories" && <RepositoriesPage />}
      {activeTab === "learn" && <LearnPage />}
      {activeTab === "chat" && <OrbitAIChat />}
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-[#fbfbfa] dark:bg-space-950 text-foreground transition-colors">
        <Header />
        <MainContent />
        <ProfileModal />
        <FloatingChatLauncher />
      </div>
    </AppProvider>
  );
};

export default App;

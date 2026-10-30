import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/common/Header";
import { RepositoriesPage } from "./components/repositories/RepositoriesPage";
import { LearnPage } from "./components/learn/LearnPage";
import { OrbitAIChat } from "./components/chat/OrbitAIChat";
import { ProfileModal } from "./components/common/ProfileModal";
import { FloatingChatLauncher } from "./components/common/FloatingChatLauncher";
import { LandingPage } from "./components/landing/LandingPage";
import { Onboarding } from "./components/onboarding/Onboarding";
import { DummyPRPage } from "./components/pr/DummyPRPage";
import { ReporbitLogo } from "./components/common/ReporbitLogo";

// Living background behind the liquid glass: charcoal base with drifting tangerine / coral light.
const Ambient: React.FC = () => (
  <div className="ambient" aria-hidden="true">
    <div className="blob" style={{ width: 560, height: 560, left: "-8%", top: "-12%", background: "#fe8500" }} />
    <div className="blob" style={{ width: 460, height: 460, right: "-6%", top: "18%", background: "#ff3b66", animationDelay: "-7s", opacity: 0.35 }} />
    <div className="blob" style={{ width: 520, height: 520, left: "30%", bottom: "-25%", background: "#ffb15c", animationDelay: "-14s", opacity: 0.3 }} />
  </div>
);

const MainContent: React.FC = () => {
  const { activeTab } = useApp();
  return (
    <main className="flex-1 relative">
      {activeTab === "repositories" && <RepositoriesPage />}
      {activeTab === "learn" && <LearnPage />}
      {activeTab === "chat" && <OrbitAIChat />}
      {activeTab === "pr" && <DummyPRPage />}
    </main>
  );
};

const Gate: React.FC = () => {
  const { status, profile } = useAuth();
  if (status === "loading") {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="animate-pulse-subtle"><ReporbitLogo /></div>
      </div>
    );
  }
  if (status === "guest") return <LandingPage />;
  if (!profile?.onboarded) return <Onboarding />;
  return (
    <AppProvider>
      <div className="relative min-h-screen flex flex-col text-foreground">
        <Header />
        <MainContent />
        <ProfileModal />
        <FloatingChatLauncher />
      </div>
    </AppProvider>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <Ambient />
    <div className="relative z-10">
      <Gate />
    </div>
  </AuthProvider>
);

export default App;

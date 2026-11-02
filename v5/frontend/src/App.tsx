import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "./context/ThemeContext";
import { Splash } from "./components/landing/Splash";
import { OrbitLoader } from "./components/common/OrbitLoader";
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
import { ProfilePage } from "./components/profile/ProfilePage";
import { startHeartbeat } from "./services/track";

// Living background behind the liquid glass: charcoal base with drifting tangerine / coral light.
const Ambient: React.FC = () => (
  <div className="ambient" aria-hidden="true">
    <div className="blob" style={{ width: 560, height: 560, left: "-8%", top: "-12%", background: "#fe8500" }} />
    <div className="blob" style={{ width: 460, height: 460, right: "-6%", top: "18%", background: "#ff3b66", animationDelay: "-7s", opacity: 0.35 }} />
    <div className="blob" style={{ width: 520, height: 520, left: "30%", bottom: "-25%", background: "#ffb15c", animationDelay: "-14s", opacity: 0.3 }} />
  </div>
);

// Small notification bubble (bottom-centre).
const Toast: React.FC = () => {
  const { toast } = useApp();
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
            className={`pointer-events-auto glass-strong rounded-2xl px-5 py-3 text-sm text-white shadow-2xl border ${toast.tone === "error" ? "border-rose-400/40" : toast.tone === "info" ? "border-white/15" : "border-tangerine-400/40"}`}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Handles the return from GitHub sign-in (#profile?github=connected).
const GithubReturn: React.FC = () => {
  const { showToast, refreshContributedRepos } = useApp();
  const { refresh } = useAuth();
  useEffect(() => {
    const m = /github=([a-z]+)/.exec(window.location.hash);
    if (!m) return;
    const msg: Record<string, [string, "success" | "error"]> = {
      connected: ["GitHub connected ✓ Importing your contributions…", "success"], denied: ["GitHub sign-in was cancelled.", "error"],
      expired: ["That GitHub sign-in link expired — please try again.", "error"], taken: ["That GitHub account is linked to another Reporbit account.", "error"],
      error: ["Couldn't connect GitHub. Please try again.", "error"],
    };
    const [text, tone] = msg[m[1]] || msg.error;
    showToast(text, tone);
    refresh().then(() => setTimeout(refreshContributedRepos, 2500));
    history.replaceState(null, "", "#profile");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const MainContent: React.FC = () => {
  const { activeTab } = useApp();
  return (
    <main className="flex-1 relative">
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          {activeTab === "repositories" && <RepositoriesPage />}
          {activeTab === "learn" && <LearnPage />}
          {activeTab === "chat" && <OrbitAIChat />}
          {activeTab === "pr" && <DummyPRPage />}
          {activeTab === "profile" && <ProfilePage />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

const Gate: React.FC = () => {
  const { status, profile } = useAuth();
  // Count active time on Reporbit while signed in (shown on the profile page).
  useEffect(() => (status === "authed" ? startHeartbeat() : undefined), [status]);
  if (status === "loading") {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <OrbitLoader size={72} />
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
        <Toast />
        <GithubReturn />
      </div>
    </AppProvider>
  );
};

export const App: React.FC = () => {
  // Boot intro plays once per browser session (click to skip).
  const [splash, setSplash] = useState(() => { try { return !sessionStorage.getItem("reporbit_intro"); } catch { return false; } });
  const done = () => { try { sessionStorage.setItem("reporbit_intro", "1"); } catch { /* ignore */ } setSplash(false); };
  return (
    <ThemeProvider>
      <AuthProvider>
        <Ambient />
        <AnimatePresence>{splash && <Splash key="splash" onDone={done} />}</AnimatePresence>
        {!splash && (
          <motion.div className="relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Gate />
          </motion.div>
        )}
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

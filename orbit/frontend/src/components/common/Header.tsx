import React, { useState } from "react";
import { useApp, NavTab } from "../../context/AppContext";
import { Compass, BookOpen, Sparkles, SlidersHorizontal, Github, Menu, X, CheckCircle2, AlertCircle } from "lucide-react";

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, profile, setIsProfileModalOpen, apiStatus, isMockMode, toggleMockMode } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: "repositories", label: "Repositories", icon: Compass },
    { id: "learn", label: "Learn", icon: BookOpen },
    { id: "chat", label: "Orbit AI", icon: Sparkles, badge: "Gemma" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-space-900/80 border-b border-border/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-8">
          <button
            onClick={() => setActiveTab("repositories")}
            className="flex items-center space-x-3 text-left focus:outline-none group"
            aria-label="Orbit Home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 animate-pulse-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                <path d="M12 3a9 9 0 0 0-7.5 4.5" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-lg tracking-tight text-neutral-900 dark:text-neutral-100">Orbit</span>
                <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                  v1.0
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:block -mt-0.5">Open Source Intelligence & Roadmaps</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold"
                      : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-mono">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Backend Status / Mock Switcher */}
          <button
            onClick={toggleMockMode}
            title={`Backend: ${apiStatus.isLive && !isMockMode ? "Live API Connected" : "Local Mock Engine Active"}. Click to toggle.`}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-mono border bg-neutral-50/80 dark:bg-neutral-800/80 border-border hover:bg-neutral-100 dark:hover:bg-neutral-700/80 transition-colors"
          >
            {apiStatus.isLive && !isMockMode ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 dark:text-emerald-400 font-sans">API: Live</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-neutral-600 dark:text-neutral-300 font-sans">API: Demo Mock</span>
              </>
            )}
          </button>

          {/* Preferences Button */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200/80 dark:hover:bg-neutral-700 rounded-lg transition-all border border-border"
            title="Edit your skills and preferences"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Preferences</span>
            <span className="px-1.5 py-0.2 bg-white dark:bg-neutral-900 rounded text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold border border-border/80">
              {profile.skills.length} skills
            </span>
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="p-2 text-neutral-600 dark:text-neutral-300 rounded-lg border border-border"
            aria-label="Preferences"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-white dark:bg-space-900 px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Mode: {isMockMode ? "Demo Fixture" : "Live Backend"}</span>
            <button
              onClick={toggleMockMode}
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              Toggle Mode
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, NavTab } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { Compass, BookOpen, Sparkles, GitPullRequest, SlidersHorizontal, Menu, X, LogOut, ChevronDown } from "lucide-react";
import { ReporbitLogo } from "./ReporbitLogo";

const NAV: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
  { id: "repositories", label: "Repositories", icon: Compass },
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "chat", label: "Orbit AI", icon: Sparkles, badge: "Gemma" },
  { id: "pr", label: "Dummy PR", icon: GitPullRequest, badge: "New" },
];

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, profile, setIsProfileModalOpen, apiStatus } = useApp();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const initials = (user?.displayName || "U").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="sticky top-3 z-40 px-3 sm:px-4">
      <div className="liquid-pill max-w-7xl mx-auto rounded-full h-14 pl-3 pr-2 flex items-center justify-between">
        <button onClick={() => setActiveTab("repositories")} className="flex items-center focus:outline-none" aria-label="Reporbit home">
          <ReporbitLogo />
        </button>

        {/* Tabs with a sliding liquid-glass lens */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV.map((item) => {
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} aria-current={active ? "page" : undefined}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${active ? "text-white" : "text-white/60 hover:text-white"}`}>
                {active && <motion.span layoutId="nav-lens" className="absolute inset-0 rounded-full liquid-lens" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                <span className="relative flex items-center gap-2">
                  <item.icon className={`w-4 h-4 ${active ? "text-tangerine-200" : ""}`} />
                  {item.label}
                  {item.badge && <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${item.badge === "New" ? "bg-rose-500/25 text-rose-200" : "bg-tangerine-500/20 text-tangerine-200"}`}>{item.badge}</span>}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/70 bg-white/5 border border-white/10" title={apiStatus.isLive ? "Connected to the Reporbit API" : "API not reachable"}>
            <span className={`w-1.5 h-1.5 rounded-full ${apiStatus.isLive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            {apiStatus.isLive ? "Live" : "Offline"}
          </span>
          <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white/80 bg-white/5 border border-white/10 hover:bg-white/10" title="Edit your stack and preferences">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Stack
            <span className="font-mono text-tangerine-300">{profile.skills.length}</span>
          </button>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-white/10" aria-haspopup="menu" aria-expanded={menuOpen}>
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-tangerine-300 to-rose-500 text-[#1b1d27] text-xs font-bold flex items-center justify-center">{initials}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/60" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div role="menu" initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 mt-3 w-64 glass-strong rounded-2xl p-2">
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-medium text-white">{user?.displayName}</p>
                    <p className="text-xs text-white/50 truncate">{user?.email}</p>
                  </div>
                  <button role="menuitem" onClick={() => { setMenuOpen(false); setIsProfileModalOpen(true); }} className="w-full text-left px-3 py-2 rounded-xl text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Edit stack & preferences</button>
                  <button role="menuitem" onClick={logout} className="w-full text-left px-3 py-2 rounded-xl text-sm text-rose-300 hover:bg-rose-500/10 flex items-center gap-2"><LogOut className="w-4 h-4" /> Sign out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-full text-white/80 hover:bg-white/10" aria-label="Toggle menu">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="md:hidden mt-2 glass-strong rounded-3xl p-3 space-y-1 max-w-7xl mx-auto">
            {NAV.map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm ${activeTab === item.id ? "liquid-lens text-white" : "text-white/75 hover:bg-white/10"}`}>
                <item.icon className="w-4 h-4" /> {item.label}
              </button>
            ))}
            <div className="border-t border-white/10 pt-2 mt-2 flex justify-between">
              <button onClick={() => { setIsProfileModalOpen(true); setMobileOpen(false); }} className="px-3 py-2 text-sm text-white/75">Edit stack</button>
              <button onClick={logout} className="px-3 py-2 text-sm text-rose-300">Sign out</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

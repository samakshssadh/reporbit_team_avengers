import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi, setCsrf, SessionUser, ServerProfile } from "../services/auth";

type AuthStatus = "loading" | "guest" | "authed";

interface AuthContextType {
  status: AuthStatus;
  user: SessionUser | null;
  profile: ServerProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (patch: Record<string, unknown>) => Promise<ServerProfile>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<ServerProfile | null>(null);

  const loadMe = useCallback(async () => {
    const me = await authApi.me();
    setUser(me.user);
    setProfile(me.profile);
    setStatus("authed");
  }, []);

  const refresh = useCallback(async () => {
    try {
      const s = await authApi.session();
      setCsrf(s.csrfToken);
      if (s.authenticated) await loadMe();
      else { setUser(null); setProfile(null); setStatus("guest"); }
    } catch {
      setStatus("guest");
    }
  }, [loadMe]);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email: string, password: string) => {
    const r = await authApi.login(email, password);
    setCsrf(r.csrfToken);
    await loadMe();
  };
  const register = async (email: string, password: string, name: string) => {
    const r = await authApi.register(email, password, name);
    setCsrf(r.csrfToken);
    await loadMe();
  };
  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    setCsrf(null); setUser(null); setProfile(null); setStatus("guest");
    window.location.hash = "";
  };
  const saveProfile = async (patch: Record<string, unknown>) => {
    const r = await authApi.saveProfile(patch);
    setProfile(r.profile);
    return r.profile;
  };

  return (
    <AuthContext.Provider value={{ status, user, profile, login, register, logout, saveProfile, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
};

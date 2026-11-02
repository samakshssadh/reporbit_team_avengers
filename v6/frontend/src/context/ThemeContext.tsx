import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";
const KEY = "reporbit_theme";

export function initialTheme(): Theme {
  try { const t = localStorage.getItem(KEY); if (t === "light" || t === "dark") return t; } catch { /* ignore */ }
  return "dark";
}
export function applyTheme(t: Theme) {
  const el = document.documentElement;
  el.classList.toggle("dark", t === "dark");
  el.classList.toggle("light", t === "light");
}

const Ctx = createContext<{ theme: Theme; toggleTheme: () => void }>({ theme: "dark", toggleTheme: () => {} });

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  useEffect(() => { applyTheme(theme); try { localStorage.setItem(KEY, theme); } catch { /* ignore */ } }, [theme]);
  const toggleTheme = () => {
    document.documentElement.classList.add("theme-switching");
    setTheme((t) => (t === "dark" ? "light" : "dark"));
    window.setTimeout(() => document.documentElement.classList.remove("theme-switching"), 450);
  };
  return <Ctx.Provider value={{ theme, toggleTheme }}>{children}</Ctx.Provider>;
};
export const useTheme = () => useContext(Ctx);

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "kdramaworld-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  const apply = useCallback((t: Theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(t);
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = t === "dark" ? "#070b13" : "#fbf5e9";
  }, []);

  useEffect(() => {
    apply(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme, apply]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const c = useContext(ThemeContext);
  if (!c) throw new Error("useTheme outside ThemeProvider");
  return c;
}

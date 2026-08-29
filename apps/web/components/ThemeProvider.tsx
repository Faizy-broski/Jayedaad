'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'jayedaad-theme';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

// Dark mode is a single site-wide preference — dashboards and the public
// marketing site (homepage, /listings, /developments, etc.) share the same
// `theme` and toggle. The `dark` class is applied straight to
// document.documentElement below, so it's live for every route the moment
// it's set and survives client-side navigation between public and dashboard
// routes, same as any other global preference. globals.css's `.dark { ... }`
// block is deliberately written bare (not `:root.dark`) so it matches
// whatever ancestor happens to carry the class — <html> included — which is
// exactly the ancestor used here.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setTheme(stored === 'dark' ? 'dark' : 'light');
  }, []);

  // Mirrors the inline blocking script in app/layout.tsx's <head> (which
  // avoids a light-mode flash on first paint) — this effect is what keeps
  // <html>'s class in sync on every subsequent toggle.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'jayedaad-theme';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

// Dark mode is dashboard-only (Super Admin/Agent/Account/Verification
// shells) — it never applies to the public marketing site (homepage,
// /listings, /developments, etc). Deliberately does NOT touch
// document.documentElement: toggling a class on <html> would make the
// choice global (it's the root of every route, public pages included), and
// since this is an SPA-style app router, that class survives client-side
// navigation away from the dashboard — a dashboard toggle used to leak dark
// mode onto every public page until the next full reload. Each dashboard
// layout instead reads `theme` here and applies the `dark` class to its own
// top-level wrapper div, so Tailwind's `dark:` variants and the
// `:root.dark` CSS variables only take effect inside that subtree; it
// unmounts (and the class with it) the moment the user navigates to a
// public route.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setTheme(stored === 'dark' ? 'dark' : 'light');
  }, []);

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

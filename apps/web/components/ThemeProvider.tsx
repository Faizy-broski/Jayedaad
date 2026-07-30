'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'jayedaad-theme';

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);

// Default is light regardless of OS preference (darkMode: 'class' in
// tailwind.config.ts, not 'media') — the inline script in app/layout.tsx's
// <head> applies a persisted 'dark' choice before first paint so returning
// dark-mode users don't see a light-mode flash; this provider just keeps
// React's state in sync with that class afterwards.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setTheme(stored === 'dark' ? 'dark' : 'light');
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
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

// Inlined into app/layout.tsx's <head> as a raw string (not JSX) so it runs
// before React hydrates/paints — avoids a light-mode flash for a user who
// previously chose dark.
export const themeInitScript = `
(function () {
  try {
    var theme = localStorage.getItem('${STORAGE_KEY}');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

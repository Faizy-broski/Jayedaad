'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

// Global toggle, present on every page (rendered from app/layout.tsx) —
// bottom-left so it doesn't collide with ReachOutToExperts' bottom-right
// floating buttons.
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed bottom-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-background text-foreground shadow-lg ring-1 ring-border hover:bg-muted"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

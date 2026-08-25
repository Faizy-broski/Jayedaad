'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

// Inline icon-button toggle for dashboard topbars — same theme/state as
// PreferencesMenu's "Dark Mode" row and the floating ThemeToggle, just
// styled to sit directly among the other topbar action buttons (Help,
// NotificationBell, etc.) instead of inside a dropdown or fixed corner.
export function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

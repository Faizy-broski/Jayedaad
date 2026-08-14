'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { getDisplayName, useAuthViewModel } from '@jayedaad/core';
import { Heart, Search, LogOut, Menu, X, ChevronsUpDown } from 'lucide-react';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { RequireEmailVerified } from '@/components/auth/RequireEmailVerified';

// Shell for the buyer account area (Favorites & Saved Searches, and later
// Notifications/Profile) — same one-layout.tsx-per-persistent-chrome-section
// convention as (agent)/layout.tsx and (super-admin)/layout.tsx, and
// deliberately its own file rather than reusing/extending (agent)'s (see
// that layout's own comment: each route group owns its shell). Buyers need
// far fewer sections than an agent's Profolio portal, so this stays a much
// smaller sidebar with no collapse/expand — not worth the complexity for a
// 1-2 item nav.
const NAV_ITEMS = [{ href: '/account/saved', label: 'Favorites & Saved Searches', icon: Heart }];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOut } = useAuthViewModel();
  const displayName = getDisplayName(user, 'Account');
  const initials = displayName.slice(0, 2).toUpperCase();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  function handleLogout() {
    // Hard redirect (not router.push) — forces a real page unload so the
    // browser can't bfcache this protected page. Without it, pressing Back
    // after logout could restore a frozen pre-logout snapshot instead of
    // hitting middleware.ts's auth check again (see next.config.js's
    // matching no-store headers() for the other half of this fix).
    signOut.mutate(undefined, { onSuccess: () => (window.location.href = '/login') });
  }

  const activeItem = NAV_ITEMS.find(({ href }) => pathname === href || pathname.startsWith(href));

  const sidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <Link href="/account/saved" className="flex min-w-0 items-center overflow-hidden">
          <Image src="/images/jayedaad-logo.png" alt="Jayedaad" width={140} height={40} priority className="h-14 w-auto object-contain" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">My Account</p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="accountActiveNavItem"
                  className="absolute inset-0 rounded-md bg-primary/10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="relative h-4 w-4 shrink-0" />
              <span className="relative truncate">{label}</span>
            </Link>
          );
        })}
        <Link
          href="/listings"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Browse Listings</span>
        </Link>
      </nav>

      <div ref={userMenuRef} className="relative shrink-0 border-t border-border p-3">
        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-full left-3 right-3 z-10 mb-2 w-auto origin-bottom-left overflow-hidden rounded-lg border border-border bg-background p-1.5 shadow-lg"
            >
              <button
                type="button"
                onClick={handleLogout}
                disabled={signOut.isPending}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {signOut.isPending ? 'Logging out…' : 'Log Out'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setUserMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
          className="flex w-full items-center gap-3 rounded-md p-1 text-left transition-colors hover:bg-muted"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </div>
    </>
  );

  return (
    <RequireEmailVerified>
      <div className="flex min-h-screen bg-muted/30">
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-background transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 shrink-0 text-sm text-muted-foreground">
              <span className="hidden sm:inline">My Account / </span>
              <span className="font-medium text-foreground">{activeItem?.label ?? 'Overview'}</span>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
              <NotificationBell />
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </RequireEmailVerified>
  );
}

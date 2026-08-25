'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { getDisplayName, useAccountProfileViewModel, useAuthViewModel, useRoleAccessViewModel } from '@jayedaad/core';
import { LayoutGrid, Home, UserCheck, ShieldCheck, Settings, LogOut, ChevronsUpDown, Menu, X, LifeBuoy } from 'lucide-react';
import { PreferencesMenu } from '@/components/layout/PreferencesMenu';
import { DarkModeToggle } from '@/components/layout/DarkModeToggle';
import { RequireEmailVerified } from '@/components/auth/RequireEmailVerified';
import { useTheme } from '@/components/ThemeProvider';

// verification_staff's real shell — previously this role's only two pages
// (/verification, /agent-verification) lived in a route group with no
// layout.tsx at all: no topbar, no nav between the two, and no way to log
// out short of clearing cookies by hand. This mirrors (super-admin)/
// layout.tsx's visual language (collapsible-free, lighter version — this
// role only ever has 4 destinations) rather than inventing a new look.
const NAV_ITEMS = [
  { href: '/verification', label: 'Dashboard', icon: LayoutGrid },
  { href: '/verification/listings', label: 'Listings Queue', icon: Home },
  { href: '/agent-verification', label: 'Agent Applications', icon: UserCheck },
  { href: '/owner-verification', label: 'Owner Applications', icon: ShieldCheck },
  // Tickets Super Admin has assigned to this staff member — see
  // support.controller.ts's GET /support/tickets/assigned.
  { href: '/verification/tickets', label: 'My Tickets', icon: LifeBuoy },
  { href: '/verification/settings', label: 'Settings', icon: Settings },
];

export default function VerificationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Scoped to this dashboard shell's own wrapper div below, not
  // document.documentElement — see ThemeProvider.tsx for why.
  const { theme } = useTheme();
  const { user, role, signOut } = useAuthViewModel();
  const { profile } = useAccountProfileViewModel();
  const { current: roleAccess } = useRoleAccessViewModel(role);
  const displayName = getDisplayName(user, 'Verification');
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel = roleAccess?.label ?? (role === 'super_admin' ? 'Super Admin' : 'Verification Staff');

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
    // Hard redirect, not router.push — same bfcache-avoidance reasoning as
    // (super-admin)/layout.tsx's handleLogout.
    signOut.mutate(undefined, { onSuccess: () => (window.location.href = '/login') });
  }

  const activeItem = NAV_ITEMS.find(({ href }) => pathname === href || (href !== '/verification' && pathname.startsWith(href)));

  const sidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-5">
        <Link href="/verification" className="flex min-w-0 items-center gap-2 overflow-hidden">
          <Image src="/images/jayedaad-logo.png" alt="Jayedaad" width={120} height={34} priority className="h-9 w-auto object-contain" />
          <span className="truncate rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Review
          </span>
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
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/verification' && pathname.startsWith(href));
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
                  layoutId="verificationActiveNavItem"
                  className="absolute inset-0 rounded-md bg-primary/10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="relative h-4 w-4 shrink-0" />
              <span className="relative truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        <div className="relative overflow-hidden rounded-xl bg-heading-gradient p-4 text-primary-foreground">
          <ShieldCheck className="absolute -right-2 -top-2 h-16 w-16 text-white/10" />
          <p className="relative text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/70">{roleLabel}</p>
          <p className="relative mt-1 text-sm font-medium leading-snug">
            {roleAccess?.description ?? "Reviews agents' property-listing submissions."}
          </p>
        </div>
      </div>

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
              <a
                href="/"
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Home className="h-4 w-4 shrink-0" />
                Go to Jayedaad
              </a>
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
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {profile?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </div>
    </>
  );

  return (
    <RequireEmailVerified>
      {/* bg-muted, not bg-muted/30 — opaque so descendants' translucent
          bg-x/NN utilities blend against this dark backdrop, not the
          always-light <body> behind it. See (super-admin)/layout.tsx. */}
      <div className={`flex min-h-screen bg-muted ${theme === 'dark' ? 'dark' : ''}`}>
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
              <span className="hidden sm:inline">Verification / </span>
              <span className="font-medium text-foreground">{activeItem?.label ?? 'Dashboard'}</span>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
              <DarkModeToggle />
              <PreferencesMenu />
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </RequireEmailVerified>
  );
}

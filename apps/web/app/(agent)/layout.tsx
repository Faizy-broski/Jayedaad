'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAgentProfileViewModel, useAuthViewModel } from '@jayedaad/core';
import {
  LayoutGrid,
  PlusCircle,
  Building2,
  Landmark,
  Inbox,
  Settings,
  CreditCard,
  Search,
  UserCircle2,
  LogOut,
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  HelpCircle,
  Sparkles,
  ChevronsUpDown,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react';
import { NotificationBell } from '@/components/layout/NotificationBell';

// Shell for every agent-portal screen (Zameen "Profolio" reference) —
// sidebar + topbar, matches every other route group's convention of one
// layout.tsx per persistent-chrome section. /submit also allows owner
// (see middleware.ts), so each item is role-gated here too — an owner
// visiting /submit shouldn't see agent-only nav items they can't open.
// agencyAdminOnly items need isAgencyAdmin=true in addition to a role match
// (see the render filter below) — not expressible via `roles` alone, since
// an agency admin is still plain role 'agent', not a distinct role value.
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, roles: ['agent', 'super_admin'] },
  { href: '/submit', label: 'Post Listing', icon: PlusCircle, roles: ['owner', 'agent', 'super_admin'] },
  { href: '/property-management', label: 'Property Management', icon: Building2, roles: ['agent', 'super_admin'] },
  { href: '/projects', label: 'Projects', icon: Landmark, roles: ['agent', 'super_admin'] },
  { href: '/crm', label: 'Inbox', icon: Inbox, roles: ['agent', 'super_admin'] },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays, roles: ['owner', 'agent', 'super_admin'] },
  { href: '/agency-staff', label: 'Agency Staff', icon: Users, roles: ['agent', 'super_admin'], agencyAdminOnly: true },
  { href: '/plan', label: 'Plan', icon: CreditCard, roles: ['agent', 'super_admin'] },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, signOut } = useAuthViewModel();
  const { profile } = useAgentProfileViewModel();
  const displayName =
    profile?.displayName || (user?.user_metadata?.display_name as string | undefined) || user?.email || 'Agent';
  const photoUrl = profile?.photoUrl;
  const initials = displayName.slice(0, 2).toUpperCase();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchListingId, setSearchListingId] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  function handleLogout() {
    signOut.mutate(undefined, { onSuccess: () => router.push('/login') });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Accepts "JYD-00001", "00001", or plain "1" — strip everything but
    // digits and search by the real listing_number, not the raw UUID.
    const digits = searchListingId.replace(/\D/g, '');
    if (!digits) return;
    router.push(`/property-management?listingNumber=${Number(digits)}`);
    setSearchOpen(false);
    setSearchListingId('');
  }

  const visibleNavItems = NAV_ITEMS.filter(
    (item) =>
      (!role || item.roles.includes(role)) && (!item.agencyAdminOnly || role === 'super_admin' || profile?.isAgencyAdmin),
  );
  const activeItem = visibleNavItems.find(
    ({ href }) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href)),
  );
  const settingsActive = pathname.startsWith('/agent-settings');

  const sidebarContent = (
    <>
      <div className={`flex h-16 shrink-0 items-center gap-2 border-b border-border px-5 ${collapsed ? 'justify-center px-0' : 'justify-between'}`}>
        {!collapsed && (
          <Link href="/dashboard" className="flex min-w-0 items-center overflow-hidden">
            <Image src="/images/jayedaad-logo.png" alt="Jayedaad" width={140} height={40} priority className="h-14 w-auto object-contain" />
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="relative h-12 w-12 shrink-0 overflow-hidden rounded" aria-label="Jayedaad">
            {/* Same wordmark as expanded, cropped to just its leading icon
                mark (object-cover + object-left on a square box) — no
                separate icon-only asset exists, and the mark sits at a fixed
                ~28% of the wordmark's width, so this crops consistently. */}
            <Image src="/favicon.ico" alt="" fill sizes="32px" className="object-cover object-left" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="hidden shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:block"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Workspace nav — the only scrollable region, so Account/Pro/profile
          below always stay pinned at the bottom regardless of list length. */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {!collapsed && (
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Workspace</p>
        )}
        {visibleNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${active ? 'text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              {active && (
                <motion.span
                  layoutId="agentActiveNavItem"
                  className="absolute inset-0 rounded-md bg-primary/10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="relative h-4 w-4 shrink-0" />
              {!collapsed && <span className="relative truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="shrink-0 border-t border-border p-3">
          <div className="relative overflow-hidden rounded-xl bg-heading-gradient p-4 text-primary-foreground">
            <Sparkles className="absolute -right-2 -top-2 h-16 w-16 text-white/10" />
            <p className="relative text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/70">Jayedaad Pro</p>
            <p className="relative mt-1 text-sm font-medium leading-snug">Boost your listing quota and Hot/Super Hot credits</p>
            <Link
              href="/plan"
              className="relative mt-3 block w-full rounded-md bg-white/15 py-1.5 text-center text-xs font-semibold text-white transition-colors hover:bg-white/25"
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* User menu — Settings/Log Out live here now (a dropdown off the
          profile trigger) instead of as standalone sidebar links, so this is
          the one thing at the bottom of the sidebar regardless of Workspace
          list length or collapsed state. Opens upward (bottom-full) since
          it's pinned at the very bottom of the viewport — opening downward
          would run off-screen. */}
      <div ref={userMenuRef} className="relative shrink-0 border-t border-border p-3">
        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute bottom-full z-10 mb-2 w-56 origin-bottom-left overflow-hidden rounded-lg border border-border bg-background p-1.5 shadow-lg ${
                collapsed ? 'left-3' : 'left-3 right-3 w-auto'
              }`}
            >
              <Link
                href="/agent-settings"
                onClick={() => {
                  setUserMenuOpen(false);
                  setMobileOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  settingsActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
              >
                <Settings className="h-4 w-4 shrink-0" />
                Settings
              </Link>
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
          className={`flex w-full items-center gap-3 rounded-md p-1 text-left transition-colors hover:bg-muted ${collapsed ? 'justify-center' : ''}`}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </span>
          )}
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{profile?.isAgencyAdmin ? 'Agency Admin' : 'Agent'}</p>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-background transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:transition-[width] lg:duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'}`}
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
            <span className="hidden sm:inline">Profolio / </span>
            <span className="font-medium text-foreground">{activeItem?.label ?? 'Overview'}</span>
          </div>

          <div className="ml-2 hidden flex-1 md:block" ref={searchRef}>
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex max-w-md items-center gap-2 rounded-full border border-input bg-muted/40 px-4 py-2 text-sm">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  value={searchListingId}
                  onChange={(e) => setSearchListingId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                  placeholder="Search by Listing ID (e.g. JYD-00001)…"
                  className="flex-1 min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex max-w-md items-center gap-2 rounded-full border border-input bg-muted/40 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Search className="h-4 w-4 shrink-0" />
                Search by Listing ID…
              </button>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              className="hidden rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:block"
              aria-label="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <NotificationBell />
            <Link
              href="/property-management"
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-input px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted sm:flex sm:text-sm"
            >
              <UserCircle2 className="h-4 w-4" />
              My Listings
            </Link>
            <Link
              href="/submit"
              className="bg-heading-gradient flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:px-4 sm:text-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Post Listing</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          {/* Persistent re-entry point for required onboarding documents
              (Owner ID + Company Registration) — become-an-agent/page.tsx's
              DocumentUploadStep otherwise only ever appears once, right
              after fresh signup/registration, so an agency admin who
              navigated away before finishing it would have no way back in.
              Mirrors AuthGateProvider's needsAgencyDocuments condition on
              mobile's SideDrawer. */}
          {profile?.agency && profile.agency.verificationStatus !== 'verified' && (
            <Link
              href="/become-an-agent"
              className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Your agency verification is incomplete — upload the required documents to continue.
            </Link>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

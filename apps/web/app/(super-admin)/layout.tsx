'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { getDisplayName, useAccountProfileViewModel, useAuthViewModel, useRoleAccessViewModel } from '@jayedaad/core';
import {
  LayoutGrid,
  Building2,
  UserCircle2,
  CreditCard,
  Inbox,
  Home,
  Users,
  ShieldCheck,
  ListTree,
  Building,
  LogOut,
  Landmark,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  HelpCircle,
  ChevronsUpDown,
  Newspaper,
  LifeBuoy,
} from 'lucide-react';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { PreferencesMenu } from '@/components/layout/PreferencesMenu';
import { DarkModeToggle } from '@/components/layout/DarkModeToggle';
import { RequireEmailVerified } from '@/components/auth/RequireEmailVerified';
import { useLogout } from '@/lib/hooks/useLogout';

// Distinct shell for the Super Admin "god mode" dashboard — deliberately
// separate from apps/web/app/(agent)/layout.tsx (the agent Profolio shell)
// rather than reusing it, since super_admin's actual capabilities here
// (agencies/agents/plans/CRM/listings/users across every account, not just
// their own) have nothing in common with the agent portal's nav. Restyled
// to match that same shell's visual language (collapsible sidebar, active
// nav pill, user menu dropdown, topbar breadcrumb) instead of the plain
// static sidebar this used to be.
//
// verification_staff's own pages (/verification, /agent-verification,
// /owner-verification) live in their own (verification) route group/shell
// and never render this layout. But middleware.ts's PROTECTED_ROUTES
// deliberately carves out one exception — /admin/listings/:id — so staff
// can open a pending listing for context from the verification queue. That
// means this shell IS reachable by verification_staff, just for exactly
// one page. Everything below is therefore role-branched: super_admin gets
// the full NAV_ITEMS/"Super Admin" branding, everyone else gets a single
// "back to queue" link and their real role label — previously this
// component had no idea who was logged in and always rendered the full
// god-mode shell, which is what made verification_staff look like they'd
// gained super_admin access.
const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/admin/agencies', label: 'Agencies', icon: Building2 },
  { href: '/admin/agents', label: 'Agents', icon: UserCircle2 },
  { href: '/admin/plans', label: 'Plans', icon: CreditCard },
  { href: '/admin/crm', label: 'CRM', icon: Inbox },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
  { href: '/admin/listings', label: 'Listings', icon: Home },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/verification-log', label: 'Verification Log', icon: ShieldCheck },
  { href: '/admin/taxonomy', label: 'Taxonomy', icon: ListTree },
  { href: '/admin/developers', label: 'Developers', icon: Building },
  { href: '/admin/projects', label: 'Projects', icon: Landmark },
  { href: '/admin/blog', label: 'Blog', icon: Newspaper },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, role } = useAuthViewModel();
  const { logout, isPending: signOutPending } = useLogout();
  const displayName = getDisplayName(user, 'Admin');
  const initials = displayName.slice(0, 2).toUpperCase();
  // The full nav below and every "Super Admin" label only ever made sense
  // for super_admin — but middleware.ts legitimately lets verification_staff
  // into this exact shell via the one /admin/listings/:id carve-out (so
  // they can view a pending listing for context from the verification
  // queue). This layout previously had no idea who was actually logged in
  // and rendered the same full god-mode shell regardless — that's what
  // read as "verification_staff got super admin access."
  const isSuperAdmin = role === 'super_admin';
  const { current: roleAccess } = useRoleAccessViewModel(role);
  const roleLabel = roleAccess?.label ?? (isSuperAdmin ? 'Super Admin' : 'Verification Staff');
  const { profile } = useAccountProfileViewModel();

  const [collapsed, setCollapsed] = useState(false);
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

  // Hard redirect (not router.push), including on a failed sign-out — forces
  // a real page unload so the browser can't bfcache this protected page.
  // Without it, pressing Back after logout could restore a frozen
  // pre-logout snapshot instead of hitting middleware.ts's auth check again
  // (see next.config.js's matching no-store headers() for the other half of
  // this fix). See useLogout.ts for why onError also redirects.
  const handleLogout = logout;

  const activeItem = isSuperAdmin
    ? NAV_ITEMS.find(({ href }) => pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href)))
    : undefined;

  const sidebarContent = (
    <>
      <div className={`flex h-16 shrink-0 items-center gap-2 border-b border-border px-5 ${collapsed ? 'justify-center px-0' : 'justify-between'}`}>
        {!collapsed && (
          <Link href={isSuperAdmin ? '/admin/dashboard' : '/verification'} className="flex min-w-0 items-center gap-2 overflow-hidden">
            {/* Dark mode swaps to the white variant Footer.tsx/Header.tsx
                already use on a dark background — the colored logo goes
                barely visible once the sidebar itself goes dark. */}
            <Image src="/images/jayedaad-logo.png" alt="Jayedaad" width={120} height={34} priority className="h-9 w-auto object-contain dark:hidden" />
            <Image
              src="/images/jayedaad-white-logo.svg"
              alt="Jayedaad"
              width={120}
              height={34}
              priority
              className="hidden h-9 w-auto object-contain dark:block"
            />
            <span className="truncate rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Admin
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href={isSuperAdmin ? '/admin/dashboard' : '/verification'} className="relative h-12 w-12 shrink-0 overflow-hidden rounded" aria-label="Jayedaad">
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

      {/* Platform nav — the only scrollable region, so the profile trigger
          below always stays pinned at the bottom regardless of list length.
          verification_staff never gets the full NAV_ITEMS list — they only
          ever reach this shell via the single /admin/listings/:id
          middleware carve-out, so there's nowhere else in here for them to
          go; showing the full 13-item super_admin nav (which every other
          link in it would just bounce them out of via middleware) is
          exactly the "looks like super admin access" bug this fixes. */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {isSuperAdmin ? (
          <>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Platform</p>
            )}
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
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
                      layoutId="adminActiveNavItem"
                      className="absolute inset-0 rounded-md bg-primary/10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4 shrink-0" />
                  {!collapsed && <span className="relative truncate">{label}</span>}
                </Link>
              );
            })}
          </>
        ) : (
          <Link
            href="/verification"
            title={collapsed ? 'Back to Verification Queue' : undefined}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">Back to Verification Queue</span>}
          </Link>
        )}
      </nav>

      {!collapsed && (
        <div className="shrink-0 border-t border-border p-3">
          <div className="relative overflow-hidden rounded-xl bg-heading-gradient p-4 text-primary-foreground">
            <ShieldCheck className="absolute -right-2 -top-2 h-16 w-16 text-white/10" />
            <p className="relative text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/70">{roleLabel}</p>
            <p className="relative mt-1 text-sm font-medium leading-snug">
              {isSuperAdmin
                ? 'Full platform access — every agency, agent, and listing.'
                : (roleAccess?.description ?? "Reviewing a listing from the verification queue.")}
            </p>
          </div>
        </div>
      )}

      {/* User menu — opens upward since it's pinned at the very bottom of
          the viewport (same pattern as the agent shell's profile trigger). */}
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
                disabled={signOutPending}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {signOutPending ? 'Logging out…' : 'Log Out'}
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
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {profile?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <RequireEmailVerified>
    {/* bg-muted, not bg-muted/30 — opaque so descendants' own translucent
        bg-x/NN utilities (bg-muted/40, bg-white/10, etc.) blend against a
        solid backdrop instead of bleeding into whatever's behind this div.
        Opaque bg-muted is close enough to invisible against light mode's
        white body that light mode looks unchanged either way. */}
    <div className="flex min-h-screen bg-muted">
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
            {isSuperAdmin ? (
              <>
                <span className="hidden sm:inline">Admin / </span>
                <span className="font-medium text-foreground">{activeItem?.label ?? 'Overview'}</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Verification / </span>
                <span className="font-medium text-foreground">Listing</span>
              </>
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
            <DarkModeToggle />
            <PreferencesMenu />
            <NotificationBell />
            <a
              href="/"
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-input px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted sm:flex sm:text-sm"
            >
              <Home className="h-4 w-4" />
              Go to Jayedaad
            </a>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
    </RequireEmailVerified>
  );
}

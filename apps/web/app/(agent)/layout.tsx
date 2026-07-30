'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAgentProfileViewModel, useAuthViewModel } from '@jayedaad/core';
import { Button } from '@jayedaad/ui-web';
import {
  LayoutGrid,
  PlusCircle,
  Building2,
  Inbox,
  Settings,
  CreditCard,
  Search,
  ExternalLink,
  UserCircle2,
  ChevronDown,
  LogOut,
} from 'lucide-react';

// Shell for every agent-portal screen (Zameen "Profolio" reference) —
// sidebar + topbar, matches every other route group's convention of one
// layout.tsx per persistent-chrome section. /submit also allows owner
// (see middleware.ts), so each item is role-gated here too — an owner
// visiting /submit shouldn't see agent-only nav items they can't open.
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, roles: ['agent', 'super_admin'] },
  { href: '/submit', label: 'Post Listing', icon: PlusCircle, roles: ['owner', 'agent', 'super_admin'] },
  { href: '/property-management', label: 'Property Management', icon: Building2, roles: ['agent', 'super_admin'] },
  { href: '/crm', label: 'Inbox', icon: Inbox, roles: ['agent', 'super_admin'] },
  { href: '/agent-settings', label: 'Settings', icon: Settings, roles: ['agent', 'super_admin'] },
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
  const canSeePropertyManagement = role === 'agent' || role === 'super_admin';

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchListingId, setSearchListingId] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  function handleLogout() {
    setMenuOpen(false);
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

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="w-60 shrink-0 border-r border-border bg-background">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <span className="text-lg font-bold text-primary">Profolio</span>
        </div>
        <nav className="space-y-1 p-3">
          {NAV_ITEMS.filter((item) => !role || item.roles.includes(role)).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <a href="/" className="flex items-center gap-1 hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5" />
              Go to Jayedaad
            </a>
          </div>
          <div className="flex items-center gap-3">
            {canSeePropertyManagement && (
              <Link href="/property-management">
                <Button variant="outline" size="sm">
                  My Listings
                </Button>
              </Link>
            )}
            <Link href="/submit">
              <Button size="sm">Post Listing</Button>
            </Link>
            <div className="relative" ref={searchRef}>
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <input
                    ref={searchInputRef}
                    value={searchListingId}
                    onChange={(e) => setSearchListingId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                    placeholder="Search by Listing ID (e.g. JYD-00001)…"
                    className="w-56 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted"
                  aria-label="Search by Listing ID"
                >
                  <Search className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <UserCircle2 className="h-6 w-6 text-muted-foreground" />
                )}
                <span className="font-medium">{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-md border border-border bg-background shadow-lg">
                  <Link
                    href="/agent-settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={signOut.isPending}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {signOut.isPending ? 'Logging out…' : 'Log Out'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

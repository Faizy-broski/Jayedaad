'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthViewModel } from '@jayedaad/core';
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
} from 'lucide-react';

// Distinct shell for the Super Admin "god mode" dashboard — deliberately
// separate from apps/web/app/(agent)/layout.tsx (the agent Profolio shell)
// rather than reusing it, since super_admin's actual capabilities here
// (agencies/agents/plans/CRM/listings/users across every account, not just
// their own) have nothing in common with the agent portal's nav. The
// existing app/(admin)/verification page intentionally stays outside this
// shell — it's still shared with verification_staff, who never reaches
// anything under /admin.
const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/admin/agencies', label: 'Agencies', icon: Building2 },
  { href: '/admin/agents', label: 'Agents', icon: UserCircle2 },
  { href: '/admin/plans', label: 'Plans', icon: CreditCard },
  { href: '/admin/crm', label: 'CRM', icon: Inbox },
  { href: '/admin/listings', label: 'Listings', icon: Home },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/verification-log', label: 'Verification Log', icon: ShieldCheck },
  { href: '/admin/taxonomy', label: 'Taxonomy', icon: ListTree },
  { href: '/admin/developers', label: 'Developers', icon: Building },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuthViewModel();

  function handleLogout() {
    signOut.mutate(undefined, { onSuccess: () => router.push('/login') });
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="w-60 shrink-0 border-r border-border bg-background">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <span className="text-lg font-bold text-primary">Admin</span>
        </div>
        <nav className="space-y-1 p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
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
            <a href="/" className="hover:text-foreground">
              Go to Jayedaad
            </a>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={signOut.isPending}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-destructive hover:bg-muted disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {signOut.isPending ? 'Logging out…' : 'Log Out'}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

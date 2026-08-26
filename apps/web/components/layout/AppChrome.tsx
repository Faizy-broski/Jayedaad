'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { SiteFooter } from './Footer';

// Route prefixes that render their own persistent shell (sidebar/topbar) —
// see apps/web/app/(agent)/layout.tsx and apps/web/app/(super-admin)/layout.tsx
// — and must NOT also get the public marketing Header/Footer stacked around
// them. Mirrors apps/web/middleware.ts's PROTECTED_ROUTES prefixes, since
// that's already the source of truth for "this is an app-shell route," not
// a public marketing page.
const APP_SHELL_PREFIXES = [
  '/account',
  '/dashboard',
  '/submit',
  '/property-management',
  '/projects',
  '/crm',
  '/pipeline',
  '/calendar',
  '/revenue',
  '/agent-settings',
  '/plan',
  '/agency-staff',
  '/help',
  '/become-an-agent',
  '/admin',
  '/verification',
  '/agent-verification',
  '/owner-verification',
];

// Auth pages (login/signup) render their own full-bleed split-screen layout
// and shouldn't get the public marketing Header/Footer stacked around them
// either — same exclusion mechanism as APP_SHELL_PREFIXES above, just for a
// different reason (standalone page design, not an app shell).
const NO_CHROME_PREFIXES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppShell = APP_SHELL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isNoChrome = NO_CHROME_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isAppShell || isNoChrome) return <>{children}</>;

  return (
    <>
      <Header />
      {children}
      <SiteFooter />
    </>
  );
}

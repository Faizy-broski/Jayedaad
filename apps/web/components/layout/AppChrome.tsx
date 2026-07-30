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
  '/dashboard',
  '/submit',
  '/property-management',
  '/crm',
  '/agent-settings',
  '/plan',
  '/agency-staff',
  '/become-an-agent',
  '/admin',
  '/verification',
  '/agent-verification',
];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppShell = APP_SHELL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isAppShell) return <>{children}</>;

  return (
    <>
      <Header />
      {children}
      <SiteFooter />
    </>
  );
}

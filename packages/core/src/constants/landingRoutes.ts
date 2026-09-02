// Where a signed-in user lands when they didn't arrive via a redirect from
// a protected route (see apps/web/middleware.ts's redirectTo param). Used
// to be four independent, hand-copied objects — apps/web/app/(auth)/
// verify-email/page.tsx, apps/web/app/(auth)/login/page.tsx, apps/web/app/
// auth/callback/route.ts, and apps/web/components/layout/Header.tsx — and
// they'd drifted: three said agent -> '/dashboard', one (verify-email,
// the page every self-service signup actually passes through) said
// agent -> '/crm'. Consolidated here as the one source of truth.
export const DEFAULT_LANDING_BY_ROLE: Record<string, string> = {
  super_admin: '/admin/dashboard',
  verification_staff: '/verification',
  agent: '/dashboard',
  owner: '/submit',
  buyer: '/account/saved',
};

export function resolveDefaultLandingRoute(role: string | undefined): string {
  return DEFAULT_LANDING_BY_ROLE[role ?? ''] || '/';
}

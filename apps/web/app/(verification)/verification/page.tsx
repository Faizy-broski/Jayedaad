'use client';

import Link from 'next/link';
import { useAdminOwnersViewModel, useAgentVerificationQueueViewModel, useVerificationQueueViewModel } from '@jayedaad/core';
import { KpiCard } from '@jayedaad/ui-web';
import { Home, ShieldCheck, UserCheck } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

// verification_staff's real landing page — this is the exact URL every
// login/redirect path already hardcodes for this role (login/page.tsx,
// verify-email/page.tsx, auth/callback/route.ts, Header.tsx), so no
// redirect changes were needed, only what renders here. Previously this URL
// rendered straight into the Listings Queue (now moved to
// /verification/listings) with no overview of the other two queues staff
// is also responsible for. Scoped deliberately to listings + agents +
// owners only — no "projects" tile, since no verification workflow exists
// for projects anywhere in the backend.
export default function VerificationDashboardPage() {
  const { total: listingsTotal, isLoading: listingsLoading } = useVerificationQueueViewModel({ pageSize: 1 });
  const { queue: agentQueue, isLoading: agentsLoading } = useAgentVerificationQueueViewModel();
  const { owners, isLoading: ownersLoading } = useAdminOwnersViewModel();

  const tiles = [
    {
      href: '/verification/listings',
      label: 'Pending Listings',
      value: listingsLoading ? '—' : listingsTotal,
      icon: Home,
    },
    {
      href: '/agent-verification',
      label: 'Pending Agent Applications',
      value: agentsLoading ? '—' : agentQueue.length,
      icon: UserCheck,
    },
    {
      href: '/owner-verification',
      label: 'Pending Owner Applications',
      value: ownersLoading ? '—' : owners.length,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <Reveal>
        <h1 className="mb-1 text-2xl font-bold text-foreground">Verification Dashboard</h1>
        <p className="mb-6 text-sm text-muted-foreground">Everything currently awaiting your review.</p>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map((tile, index) => (
          <Reveal key={tile.href}>
            <Link href={tile.href} className="block transition-transform hover:-translate-y-0.5">
              <KpiCard index={index} icon={tile.icon} label={tile.label} value={tile.value} />
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

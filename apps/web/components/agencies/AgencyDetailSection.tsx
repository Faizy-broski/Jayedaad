'use client';

import Link from 'next/link';
import { useAgencyDetailViewModel } from '@jayedaad/core';
import { AgencyDetail } from './AgencyDetail';

interface AgencyDetailSectionProps {
  slug: string;
}

export function AgencyDetailSection({ slug }: AgencyDetailSectionProps) {
  const { agency, isLoading, error, stats, isStatsLoading } = useAgencyDetailViewModel(slug);

  if (isLoading) {
    return <div className="py-32 text-center text-sm text-slate-500">Loading agency…</div>;
  }

  if (error || !agency) {
    return (
      <div className="flex flex-col items-center gap-3 py-32 text-center">
        <p className="text-sm text-slate-500">This agency couldn&apos;t be found — it may have been removed.</p>
        <Link href="/agents" className="text-sm font-medium text-primary hover:underline">
          Back to all agents
        </Link>
      </div>
    );
  }

  return <AgencyDetail agency={agency} stats={stats} isStatsLoading={isStatsLoading} />;
}

'use client';

import Link from 'next/link';
import { useAgencyDetailViewModel } from '@jayedaad/core';
import { AgencyDetail } from './AgencyDetail';
import { SAMPLE_AGENCY_DETAILS } from '@/data/sampleAgencies';

interface AgencyDetailSectionProps {
  slug: string;
}

// Falls back to SAMPLE_AGENCY_DETAILS[slug] whenever the real API 404s/
// errors for this slug — lets AgencyCard's sample-data cards (rendered when
// the list sections fall back, see TitaniumAgenciesSection etc.) link
// somewhere real instead of a dead "not found" page. A slug that matches
// neither real nor sample data still shows the genuine not-found state.
export function AgencyDetailSection({ slug }: AgencyDetailSectionProps) {
  const { agency, isLoading, error, stats, isStatsLoading } = useAgencyDetailViewModel(slug);

  if (isLoading) {
    return <div className="py-32 text-center text-sm text-slate-500">Loading agency…</div>;
  }

  if (error || !agency) {
    const sample = SAMPLE_AGENCY_DETAILS[slug];
    if (sample) {
      return <AgencyDetail agency={sample.agency} stats={sample.stats} isStatsLoading={false} />;
    }

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

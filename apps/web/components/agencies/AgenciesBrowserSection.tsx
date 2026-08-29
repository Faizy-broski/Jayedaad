'use client';

import { useSearchParams } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useAgenciesViewModel, useAgencyCitiesViewModel, type AgencyTier } from '@jayedaad/core';
import { TitaniumAgenciesSection } from './TitaniumAgenciesSection';
import { FeaturedAgenciesSection } from './FeaturedAgenciesSection';
import { BrowseAgenciesByCitySection } from './BrowseAgenciesByCitySection';
import { AgenciesSearchResults } from './AgenciesSearchResults';

const VALID_TIERS: AgencyTier[] = ['titanium', 'featured', 'basic'];

// Seeds every field PropertySearchBar's "agencies" variant can send —
// city/location/propertyTypeSlug/search — plus the tier the curated
// sections' "View all"/"View Agencies" links carry. With no filter active
// this shows the curated Titanium/Featured/By-City layout; if the real API
// has no agencies at all yet, all three sections render nothing on their
// own, so this component fetches the same (cached, deduped by react-query)
// data to detect that all-empty case and show a fallback instead of a
// blank page.
export function AgenciesBrowserSection() {
  const searchParams = useSearchParams();

  const city = searchParams.get('city') ?? '';
  const location = searchParams.get('location') ?? '';
  const propertyTypeSlug = searchParams.get('propertyTypeSlug') ?? '';
  const search = searchParams.get('search') ?? '';
  const tierParam = searchParams.get('tier');
  const tier = VALID_TIERS.includes(tierParam as AgencyTier) ? (tierParam as AgencyTier) : undefined;

  const hasFilters = Boolean(city || location || propertyTypeSlug || search || tier);

  const titanium = useAgenciesViewModel({ tier: 'titanium', pageSize: 12 });
  const featured = useAgenciesViewModel({ tier: 'featured', pageSize: 8 });
  const cityList = useAgencyCitiesViewModel();

  if (hasFilters) {
    return <AgenciesSearchResults city={city} location={location} propertyTypeSlug={propertyTypeSlug} search={search} tier={tier} />;
  }

  const isLoading = titanium.isLoading || featured.isLoading || cityList.isLoading;
  const isAllEmpty = titanium.agencies.length === 0 && featured.agencies.length === 0 && cityList.cities.length === 0;

  if (!isLoading && isAllEmpty) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No agencies to show yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            We&apos;re still onboarding agencies. Check back soon, or browse listings in the meantime.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <TitaniumAgenciesSection />
      <FeaturedAgenciesSection />
      <BrowseAgenciesByCitySection />
    </>
  );
}

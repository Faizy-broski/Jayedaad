'use client';

import { useSearchParams } from 'next/navigation';
import type { AgencyTier } from '@jayedaad/core';
import { TitaniumAgenciesSection } from './TitaniumAgenciesSection';
import { FeaturedAgenciesSection } from './FeaturedAgenciesSection';
import { BrowseAgenciesByCitySection } from './BrowseAgenciesByCitySection';
import { AgenciesSearchResults } from './AgenciesSearchResults';

const VALID_TIERS: AgencyTier[] = ['titanium', 'featured', 'basic'];

// Seeds every field PropertySearchBar's "agencies" variant can send —
// city/location/propertyTypeSlug/search — plus the tier the curated
// sections' "View all"/"View Agencies" links carry. With no filter active
// this shows the curated Titanium/Featured/By-City layout (each section
// renders nothing on its own if the real API has no data yet — no
// all-empty case to handle here); with a filter active, it swaps to the
// full paginated/searchable directory.
export function AgenciesBrowserSection() {
  const searchParams = useSearchParams();

  const city = searchParams.get('city') ?? '';
  const location = searchParams.get('location') ?? '';
  const propertyTypeSlug = searchParams.get('propertyTypeSlug') ?? '';
  const search = searchParams.get('search') ?? '';
  const tierParam = searchParams.get('tier');
  const tier = VALID_TIERS.includes(tierParam as AgencyTier) ? (tierParam as AgencyTier) : undefined;

  const hasFilters = Boolean(city || location || propertyTypeSlug || search || tier);

  if (hasFilters) {
    return <AgenciesSearchResults city={city} location={location} propertyTypeSlug={propertyTypeSlug} search={search} tier={tier} />;
  }

  return (
    <>
      <TitaniumAgenciesSection />
      <FeaturedAgenciesSection />
      <BrowseAgenciesByCitySection />
    </>
  );
}

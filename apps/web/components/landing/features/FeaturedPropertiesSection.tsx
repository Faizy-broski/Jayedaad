'use client';

import { useListingSearchViewModel } from '@jayedaad/core';
import { FeaturedProperties } from './FeaturedProperties';
import { RecentlyVisitedPropertiesSection } from './RecentlyVisitedPropertiesSection';
import { listingToProperty } from '@/lib/listingMappers';

// GET /listings has no "featured" flag server-side, so this just surfaces
// the newest verified listings.
export function FeaturedPropertiesSection() {
  const { listings } = useListingSearchViewModel({ sortBy: 'newest', page: 1, pageSize: 8 });

  return (
    <FeaturedProperties properties={listings.map(listingToProperty)}>
      <RecentlyVisitedPropertiesSection />
    </FeaturedProperties>
  );
}
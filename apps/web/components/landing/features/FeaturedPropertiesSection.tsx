'use client';

import { useListingSearchViewModel } from '@jayedaad/core';
import { FeaturedProperties } from './FeaturedProperties';
import { RecentlyVisitedPropertiesSection } from './RecentlyVisitedPropertiesSection';
import { FEATURED_PROPERTIES } from '@/data/properties';
import { listingToProperty } from '@/lib/listingMappers';

// GET /listings has no "featured" flag server-side, so this just surfaces
// the newest verified listings.
export function FeaturedPropertiesSection() {
  const { listings, isLoading } = useListingSearchViewModel({ sortBy: 'newest', page: 1, pageSize: 8 });
  const properties = listings.map(listingToProperty);
  const showLive = !isLoading && properties.length > 0;

  return (
    <FeaturedProperties properties={showLive ? properties : FEATURED_PROPERTIES}>
      <RecentlyVisitedPropertiesSection />
    </FeaturedProperties>
  );
}

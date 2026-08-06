'use client';

import { FeaturedLocations } from './FeaturedLocations';
import { CITIES } from '@/data/cities';
import { useRealCities } from '@/lib/useRealCities';

interface FeaturedLocationsSectionProps {
  embedded?: boolean;
}

// Same real GET /listings-backed city data as the homepage's Where We Live
// section (useRealCities) — just this page's own copy/layout around it.
export function FeaturedLocationsSection({ embedded }: FeaturedLocationsSectionProps) {
  const { cities, isLoading } = useRealCities();
  const showLive = !isLoading && cities.length > 0;

  return <FeaturedLocations cities={showLive ? cities : CITIES} embedded={embedded} />;
}

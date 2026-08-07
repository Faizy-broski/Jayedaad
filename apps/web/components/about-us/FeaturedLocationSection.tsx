'use client';

import { FeaturedLocations } from './FeaturedLocations';
import { useRealCities } from '@/lib/useRealCities';

interface FeaturedLocationsSectionProps {
  embedded?: boolean;
}

// Same real GET /listings-backed city data as the homepage's Where We Live
// section (useRealCities) — just this page's own copy/layout around it.
export function FeaturedLocationsSection({ embedded }: FeaturedLocationsSectionProps) {
  const { cities } = useRealCities();

  return <FeaturedLocations cities={cities} embedded={embedded} />;
}
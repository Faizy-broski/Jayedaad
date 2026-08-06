'use client';

import { WhereWeLive } from './WhereWeLive';
import { CITIES } from '@/data/cities';
import { useRealCities } from '@/lib/useRealCities';

export function WhereWeLiveSection() {
  const { cities, isLoading } = useRealCities();
  const showLive = !isLoading && cities.length > 0;

  return <WhereWeLive cities={showLive ? cities : CITIES} />;
}

'use client';

import { WhereWeLive } from './WhereWeLive';
import { useRealCities } from '@/lib/useRealCities';

export function WhereWeLiveSection() {
  const { cities } = useRealCities();

  return <WhereWeLive cities={cities} />;
}
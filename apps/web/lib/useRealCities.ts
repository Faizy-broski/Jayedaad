'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { listingsRepository } from '@jayedaad/core';
import type { City } from '@/lib/types';

// GET /listings/locations/cities returns the real distinct `city` values
// off live listings. Only cities we have a real photo asset for are shown
// (this app ships 6 city images) — anything else is simply omitted rather
// than rendering a placeholder image. Shared by the homepage's Where We
// Live section and the About page's Featured Locations section — same real
// data, same city image set.
const KNOWN_CITY_IMAGES: Record<string, string> = {
  islamabad: '/images/cities/Islamabad.jpg',
  karachi: '/images/cities/karachi.jpg',
  lahore: '/images/cities/lahore.jpg',
};

export function useRealCities() {
  const citiesQuery = useQuery({
    queryKey: ['listings', 'cities'],
    queryFn: listingsRepository.listCities,
    staleTime: 5 * 60_000,
  });

  const knownCities = (citiesQuery.data ?? []).filter((name) => KNOWN_CITY_IMAGES[name.toLowerCase()]);

  const countQueries = useQueries({
    queries: knownCities.map((name) => ({
      queryKey: ['listings', 'city-count', name],
      queryFn: () => listingsRepository.searchPublic({ city: name, pageSize: 1 }),
      staleTime: 5 * 60_000,
    })),
  });

  const cities: City[] = knownCities.map((name, index) => ({
    id: name.toLowerCase(),
    name,
    homesCount: countQueries[index].data?.total ?? 0,
    image: KNOWN_CITY_IMAGES[name.toLowerCase()],
    href: `/listings?city=${encodeURIComponent(name)}`,
  }));

  return { cities, isLoading: citiesQuery.isLoading };
}
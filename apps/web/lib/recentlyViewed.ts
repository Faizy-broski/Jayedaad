import type { Property } from '@/lib/types';

// Per-browser "recently visited" history — there's no backend endpoint for
// personalized view history (GET /listings/trending is sitewide, not
// per-user), so this is tracked client-side off the same 'view' moment
// PropertyDetailSection already fires trackEngagement() from.
const STORAGE_KEY = 'jayedaad-recently-viewed';
const MAX_ITEMS = 8;

export function addRecentlyViewed(property: Property): void {
  if (typeof window === 'undefined') return;

  const next = [property, ...getRecentlyViewed().filter((p) => p.id !== property.id)].slice(0, MAX_ITEMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getRecentlyViewed(): Property[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Property[]) : [];
  } catch {
    return [];
  }
}
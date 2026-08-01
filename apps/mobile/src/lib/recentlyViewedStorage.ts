import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Listing } from '@jayedaad/core';

// Backs HomeScreen's "Recent Properties" section, right after Featured
// Properties. No buyer-side view-history endpoint exists on the backend, so
// this is tracked purely on-device — same AsyncStorage-direct approach as
// rememberMeStorage.ts, just for a list instead of a single value. Stores
// full Listing objects (not just ids) so HomeScreen can render them with the
// existing PropertyCard without an extra fetch-by-ids round trip.
const STORAGE_KEY = 'recentlyViewedListings';
const MAX_ENTRIES = 10;

export async function getRecentlyViewed(): Promise<Listing[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Listing[];
  } catch {
    return [];
  }
}

export async function addRecentlyViewed(listing: Listing): Promise<void> {
  const existing = await getRecentlyViewed();
  const deduped = existing.filter((l) => l.id !== listing.id);
  const next = [listing, ...deduped].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

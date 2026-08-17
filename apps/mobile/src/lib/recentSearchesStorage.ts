import AsyncStorage from '@react-native-async-storage/async-storage';

// Backs BuyerSearchScreen's "Recent searches" list — no backend endpoint
// for this exists (useSavedSearchesViewModel is a different, user-named,
// explicitly-saved concept), so this is tracked purely on-device, same
// AsyncStorage-direct approach as recentlyViewedStorage.ts, just for plain
// keyword strings instead of full Listing snapshots.
const STORAGE_KEY = 'recentSearchKeywords';
const MAX_ENTRIES = 5;

export async function getRecentSearches(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function addRecentSearch(keyword: string): Promise<void> {
  const trimmed = keyword.trim();
  if (!trimmed) return;
  const existing = await getRecentSearches();
  const deduped = existing.filter((k) => k.toLowerCase() !== trimmed.toLowerCase());
  const next = [trimmed, ...deduped].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function removeRecentSearch(keyword: string): Promise<void> {
  const existing = await getRecentSearches();
  const next = existing.filter((k) => k !== keyword);
  if (next.length !== existing.length) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}

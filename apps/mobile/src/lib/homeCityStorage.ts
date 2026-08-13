import AsyncStorage from '@react-native-async-storage/async-storage';

// Persists the buyer's manually-picked "home city" shown in HomeScreen's
// header location row — same on-device-only approach as
// recentlyViewedStorage.ts (no backend field for a non-agent user's city,
// see OwnProfile in packages/core/src/services/accountRepository.ts).
const STORAGE_KEY = 'homeCity';

export async function getHomeCity(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY);
}

export async function setHomeCity(city: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, city);
}

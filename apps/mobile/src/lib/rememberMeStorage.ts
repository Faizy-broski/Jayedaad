import AsyncStorage from '@react-native-async-storage/async-storage';

// Real Remember-Me for mobile, same intent as apps/web's lib/rememberMe.ts —
// web rewrites its Supabase cookie to be session-only when unchecked; RN has
// no cookies/localStorage, so the equivalent here is a Supabase `storage`
// adapter for the auth client (see App.tsx's configureSupabaseClient call)
// that only persists to AsyncStorage (survives app restarts) when
// remembered=true. When false, writes are kept in an in-memory map instead —
// the session still works normally for the rest of this app run, it just
// won't be there next time the app is opened, mirroring "session-only".
let remembered = true;
const memoryStore = new Map<string, string>();

export function setRememberMe(value: boolean): void {
  remembered = value;
}

export const rememberMeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const memoryValue = memoryStore.get(key);
    if (memoryValue !== undefined) return memoryValue;
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryStore.set(key, value);
    if (remembered) {
      await AsyncStorage.setItem(key, value);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    memoryStore.delete(key);
    await AsyncStorage.removeItem(key);
  },
};

import { AppState } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';

// Supabase's own auth-js explicitly does NOT handle React Native foreground/
// background transitions itself — GoTrueClient's _handleVisibilityChange()
// just starts its refresh ticker once for any non-browser environment and
// "assumes always foreground" (its own doc comment). Browsers get a free
// visibilitychange listener that recovers the session the instant a tab
// becomes visible again; RN gets no equivalent, and the OS throttles JS
// timers while backgrounded — so a session can go stale while the app is
// backgrounded with nothing ever attempting recovery. This is the official
// Supabase RN pattern (AppState-driven startAutoRefresh/stopAutoRefresh) to
// fill that gap, wired from App.tsx right after the client is configured.
export function startSupabaseAppStateSync(client: SupabaseClient): () => void {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      client.auth.startAutoRefresh();
    } else {
      client.auth.stopAutoRefresh();
    }
  });

  return () => subscription.remove();
}

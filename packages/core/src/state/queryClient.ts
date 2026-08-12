import { QueryClient } from '@tanstack/react-query';

// Single QueryClient factory shared by web and mobile so caching/retry
// behavior (and therefore perceived CRM performance, see blueprint §4.1)
// is identical across platforms.
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // A 429 (rate-limited — see httpClient.ts's response interceptor,
        // which tags these with isRateLimited) is worth retrying a couple
        // more times with real backoff, since the limiter's own window
        // clears in well under a minute — immediately giving up after one
        // near-instant retry (the plain `retry: 1` every other error gets)
        // just meant the failure surfaced faster, not that it went away.
        retry: (failureCount, error: any) => (error?.isRateLimited ? failureCount < 3 : failureCount < 1),
        // Rate-limited: longer, capped backoff (its window clears in under
        // a minute). Everything else: react-query's own default backoff
        // curve (1s, 2s, 4s... capped at 30s), same as the plain `retry: 1`
        // this replaces used implicitly before this override existed.
        retryDelay: (attemptIndex, error: any) =>
          error?.isRateLimited ? Math.min(2000 * 2 ** attemptIndex, 15_000) : Math.min(1000 * 2 ** attemptIndex, 30_000),
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

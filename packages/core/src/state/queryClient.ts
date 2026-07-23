import { QueryClient } from '@tanstack/react-query';

// Single QueryClient factory shared by web and mobile so caching/retry
// behavior (and therefore perceived CRM performance, see blueprint §4.1)
// is identical across platforms.
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

'use client';

import { createContext, useContext, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthViewModel, useFavoritesViewModel } from '@jayedaad/core';

interface FavoritesContextValue {
  isFavorited: (listingId: string) => boolean;
  isPending: (listingId: string) => boolean;
  toggle: (listingId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

// Single mount point (in app/providers.tsx, alongside QueryClientProvider) so
// every PropertyCard/listing surface across the app shares the same
// favorited-ID lookup and mutation state, without each of the 6+ disconnected
// call sites (FeaturedProperties, SimilarProperties, NewProjects,
// NewlyStaged, RecentlyVisitedProperties, ListingsBrowser/PropertyGrid, and
// (buyer)/search's own card) needing to fetch/pass isFavorited individually.
// Deliberately NOT added to the shared Property/ListingProperty types
// (apps/web/lib/types.ts) — those are also used by anonymous/unauthenticated
// rendering paths and pure listing->view mappers with no user context.
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthViewModel();
  const { favorites, add, remove } = useFavoritesViewModel();

  const favoritedIds = useMemo(() => new Set(favorites.map((f) => f.listingId)), [favorites]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      isFavorited: (listingId) => favoritedIds.has(listingId),
      isPending: (listingId) =>
        (add.isPending && add.variables === listingId) || (remove.isPending && remove.variables === listingId),
      toggle: (listingId) => {
        // Redirect rather than let the mutation fire and 401 — mirrors the
        // login-gate pattern used elsewhere for buyer-only actions.
        if (!isAuthenticated) {
          router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
          return;
        }
        if (favoritedIds.has(listingId)) remove.mutate(listingId);
        else add.mutate(listingId);
      },
    }),
    [favoritedIds, add, remove, isAuthenticated, router, pathname],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}

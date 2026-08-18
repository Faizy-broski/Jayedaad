'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Bell, Heart, Search, Trash2 } from 'lucide-react';
import {
  AlertFrequency,
  useFavoritesViewModel,
  useFormattedPrice,
  useSavedSearchesViewModel,
} from '@jayedaad/core';

type TabId = 'favorites' | 'saved';

const TABS: { id: TabId; label: string }[] = [
  { id: 'favorites', label: 'Favorites' },
  { id: 'saved', label: 'Saved Searches' },
];

const ALERT_FREQUENCIES: AlertFrequency[] = ['instant', 'daily', 'weekly', 'off'];

// Web equivalent of apps/mobile/src/screens/FavoritesScreen.tsx — same
// segmented Favorites/Saved Searches tabs, card list, empty states, and
// optimistic remove-with-toast pattern, ported to this app's ui-web/toast
// conventions instead of ui-native's.
export default function SavedPage() {
  // useSearchParams requires a Suspense boundary (Next.js de-opts an
  // unwrapped client component into full client-side rendering otherwise)
  // — same wrapping pattern Header.tsx already uses for the same hook.
  return (
    <Suspense>
      <SavedPageInner />
    </Suspense>
  );
}

function SavedPageInner() {
  const searchParams = useSearchParams();
  // Header.tsx's new "Favourites"/"Saved Searches" mobile-menu links land
  // here with ?tab=favorites|saved — falls back to 'favorites' for the
  // plain /account/saved link (and the sidebar nav item), same default the
  // local tab state always had before this query param existed.
  const initialTab: TabId = searchParams.get('tab') === 'saved' ? 'saved' : 'favorites';
  const [tab, setTab] = useState<TabId>(initialTab);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-xl font-semibold text-foreground">Favorites & Saved Searches</h1>

      <div className="mb-6 flex rounded-full bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'favorites' ? <FavoritesTab /> : <SavedSearchesTab />}
    </div>
  );
}

function EmptyState({ icon: Icon, heading, message }: { icon: typeof Heart; heading: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-7 w-7 text-primary" />
      </span>
      <p className="text-base font-semibold text-foreground">{heading}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
      <Link
        href="/listings"
        className="mt-2 rounded-full bg-heading-gradient px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Search Properties
      </Link>
    </div>
  );
}

function FavoritesTab() {
  const { favorites, isLoading, remove, removeProject } = useFavoritesViewModel();
  const { format: formatPrice } = useFormattedPrice();

  if (isLoading) return <p className="py-12 text-center text-sm text-muted-foreground">Fetching favorites…</p>;

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        heading="No Favorites Yet"
        message="Press the heart icon on any property or project to add it to your favorites."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {favorites.map((favorite) => {
        const isProject = !!favorite.project;
        const item = favorite.listing ?? favorite.project;
        return (
          <li
            key={favorite.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-4 shadow-sm"
          >
            {item ? (
              <Link
                href={isProject ? `/developments/${favorite.project!.slug}` : `/listings/${favorite.listingId}`}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-semibold text-foreground">
                  {isProject ? favorite.project!.name : favorite.listing!.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.area}, {item.city}
                </p>
                {!isProject && (
                  <p className="mt-1 text-sm font-bold text-primary">{formatPrice(Number(favorite.listing!.price))}</p>
                )}
              </Link>
            ) : (
              <p className="min-w-0 flex-1 text-sm text-muted-foreground">No longer available</p>
            )}
            <button
              type="button"
              aria-label="Remove from favorites"
              onClick={() =>
                isProject
                  ? removeProject.mutate(favorite.projectId!, {
                      onSuccess: () => toast.success('Removed from favorites.'),
                      onError: () => toast.error('Something went wrong — please try again.'),
                    })
                  : remove.mutate(favorite.listingId!, {
                      onSuccess: () => toast.success('Removed from favorites.'),
                      onError: () => toast.error('Something went wrong — please try again.'),
                    })
              }
              className="shrink-0 rounded-full bg-destructive/10 p-2 text-destructive transition-colors hover:bg-destructive/20"
            >
              <Heart className="h-4 w-4" fill="currentColor" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SavedSearchesTab() {
  const { savedSearches, isLoading, remove, updateAlertFrequency } = useSavedSearchesViewModel();

  if (isLoading) return <p className="py-12 text-center text-sm text-muted-foreground">Fetching saved searches…</p>;

  if (savedSearches.length === 0) {
    return (
      <EmptyState
        icon={Search}
        heading="No Saved Searches"
        message="Save a search from the Search page to get notified about new matches."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {savedSearches.map((search) => (
        <li key={search.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{search.name ?? 'Saved search'}</p>
            <label className="mt-2 flex w-fit items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              <Bell className="h-3.5 w-3.5 text-primary" />
              Alerts:
              <select
                value={search.alertFrequency}
                onChange={(e) =>
                  updateAlertFrequency.mutate(
                    { id: search.id, alertFrequency: e.target.value as AlertFrequency },
                    {
                      onSuccess: () => toast.success('Alert frequency updated.'),
                      onError: () => toast.error('Could not update alert frequency — please try again.'),
                    },
                  )
                }
                className="bg-transparent font-semibold text-foreground outline-none"
              >
                {ALERT_FREQUENCIES.map((freq) => (
                  <option key={freq} value={freq}>
                    {freq}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            aria-label="Remove saved search"
            onClick={() =>
              remove.mutate(search.id, {
                onSuccess: () => toast.success('Saved search removed.'),
                onError: () => toast.error('Something went wrong — please try again.'),
              })
            }
            className="shrink-0 rounded-full bg-destructive/10 p-2 text-destructive transition-colors hover:bg-destructive/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

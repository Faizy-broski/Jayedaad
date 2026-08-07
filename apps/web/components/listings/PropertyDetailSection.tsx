'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { listingsRepository, useListingDetailViewModel } from '@jayedaad/core';
import { PropertyDetail } from './PropertyDetail';
import { listingToListingProperty, listingToProperty } from '@/lib/listingMappers';
import { getViewerSessionId } from '@/lib/viewerSession';
import { addRecentlyViewed } from '@/lib/recentlyViewed';

interface PropertyDetailSectionProps {
  listingId: string;
}

// Real GET /listings/:id + GET /listings/:id/similar — both existed in
// packages/core (listingsRepository.findById/findSimilar,
// useListingDetailViewModel) with no caller anywhere until now, since no
// detail page was wired to them.
export function PropertyDetailSection({ listingId }: PropertyDetailSectionProps) {
  const { listing, isLoading, error, similar } = useListingDetailViewModel(listingId);

  // Fire-and-forget, once per listing id — this is the only place a 'view'
  // event can honestly originate (the listing actually loaded), and it's
  // what GET /listings/trending's "most visited" ranking counts. Keyed on
  // id rather than the whole `listing` object deliberately: a background
  // refetch returns a new object reference for the same listing and must
  // not double-count a view.
  useEffect(() => {
    if (!listing) return;
    listingsRepository
      .trackEngagement(listing.id, { type: 'view', platform: 'web', viewerSessionId: getViewerSessionId() })
      .catch(() => {});
    // Same "actually loaded" moment backs the homepage's per-visitor
    // Recently Visited carousel — localStorage since there's no per-user
    // view-history endpoint, just the sitewide trackEngagement above.
    addRecentlyViewed(listingToProperty(listing));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  if (isLoading) {
    return <div className="py-32 text-center text-sm text-slate-500">Loading property…</div>;
  }

  if (error || !listing) {
    return (
      <div className="flex flex-col items-center gap-3 py-32 text-center">
        <p className="text-sm text-slate-500">This listing couldn&apos;t be found — it may have been removed.</p>
        <Link href="/listings" className="text-sm font-medium text-primary hover:underline">
          Back to all listings
        </Link>
      </div>
    );
  }

  const images = [...listing.media]
    .filter((m) => m.type === 'image')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((m) => m.url);

  return (
    <PropertyDetail
      listing={listingToListingProperty(listing)}
      similar={similar.map(listingToListingProperty)}
      images={images}
    />
  );
}
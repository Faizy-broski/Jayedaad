import { convertArea, formatPrice, type Listing, type TrendingListing } from '@jayedaad/core';
import type { ListingProperty, Property } from '@/lib/types';

export function listingToProperty(listing: Listing): Property {
  const cover = listing.media.find((m) => m.isCover) ?? listing.media[0];

  return {
    id: listing.id,
    title: listing.title,
    location: [listing.area, listing.city].filter(Boolean).join(', '),
    price: formatPrice(Number(listing.price)),
    priceValue: Number(listing.price),
    image: cover?.url ?? '/images/properties/sky-view-villa.jpg',
    listingType: listing.purpose,
    verified: listing.status === 'verified',
    beds: listing.bedrooms ?? 0,
    baths: listing.bathrooms ?? 0,
    // Was `Number(listing.areaValue)` — silently mislabeled as "sqft" by
    // every consumer (PropertyCard.tsx) regardless of the listing's real
    // stored areaUnit (a 10-Marla listing rendered as "10 sqft"). Now
    // actually converted to true square feet via convertArea.
    areaSqft: convertArea(Number(listing.areaValue), listing.areaUnit, 'sqft'),
    boostTier: listing.boostTier,
    storyExpiresAt: listing.storyExpiresAt,
    posterType: listing.posterType,
  };
}

// GET /listings/trending's real per-listing view count, carried through
// for the Most Visited carousel's "N views" badge.
export function trendingListingToProperty(listing: TrendingListing): Property {
  return { ...listingToProperty(listing), viewCount: listing.viewCount };
}

export function listingToListingProperty(listing: Listing): ListingProperty {
  const contact = listing.contactNumbers.find((c) => c.type === 'mobile') ?? listing.contactNumbers[0];
  const parkingAmenity = listing.amenities.find((a) => a.slug === 'parking_spaces');

  return {
    ...listingToProperty(listing),
    listingNumber: listing.listingNumber,
    // Real Super Admin-managed taxonomy — same property_types/
    // property_type_categories data the agent submit form's category ->
    // property type picker uses (apps/web/app/(agent)/submit/page.tsx),
    // not a fixed enum bucketed down to a lossy visual approximation.
    propertyType: listing.propertyType.label,
    propertyTypeSlug: listing.propertyType.slug,
    propertyTypeCategorySlug: listing.propertyType.category.slug,
    priceValue: Number(listing.price),
    furnished: listing.furnishingStatus === 'furnished',
    readyToMove: listing.readyForPossession,
    amenities: listing.amenities.map((a) => a.label),
    lat: listing.latitude ?? 0,
    lng: listing.longitude ?? 0,
    description: listing.description ?? '',
    yearBuilt: listing.yearBuilt ?? 0,
    parkingSpots: parkingAmenity?.value ?? 0,
    // No ownership field exists on the real Listing model yet — every
    // Pakistani market listing defaults to Freehold rather than guessing.
    ownership: 'Freehold',
    posterType: listing.posterType,
    // posterType 'owner' always has agent: null (enforced by the DB's
    // enforce_listing_poster_type trigger) — 'Jayedaad Team' previously
    // filled that gap here, misleadingly framing an owner-listed property
    // as platform/agent-branded. Now labeled plainly as the property owner.
    agent: {
      name: listing.posterType === 'owner' ? 'Property Owner' : listing.agent?.displayName ?? 'Jayedaad Team',
      role: listing.agent?.agency?.name ?? (listing.posterType === 'owner' ? 'Owner' : 'Agent'),
      // No fake fallback photo — that pointed at a file that was never
      // actually added to public/images/agents/, so it rendered as a
      // broken-image icon for every owner-posted listing (agent is always
      // null there) and any agent without a real photoUrl. AgentCard.tsx
      // shows an icon placeholder instead when this is null.
      avatar: listing.agent?.photoUrl ?? null,
      phone: contact ? `${contact.countryCode}${contact.number}` : '',
      subscriptionTierName: listing.agent?.subscriptionTierName ?? null,
      email: listing.agent?.email ?? null,
    },
  };
}
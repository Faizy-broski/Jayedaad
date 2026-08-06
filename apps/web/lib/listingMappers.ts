import { formatPrice, type Listing, type TrendingListing } from '@jayedaad/core';
import type { ListingProperty, Property } from '@/lib/types';

export function listingToProperty(listing: Listing): Property {
  const cover = listing.media.find((m) => m.isCover) ?? listing.media[0];

  return {
    id: listing.id,
    title: listing.title,
    location: [listing.area, listing.city].filter(Boolean).join(', '),
    price: formatPrice(Number(listing.price)),
    image: cover?.url ?? '/images/properties/sky-view-villa.jpg',
    listingType: listing.purpose,
    verified: listing.status === 'verified',
    beds: listing.bedrooms ?? 0,
    baths: listing.bathrooms ?? 0,
    areaSqft: Number(listing.areaValue),
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
    agent: {
      name: listing.agent?.displayName ?? 'Jayedaad Team',
      role: listing.agent?.agency?.name ?? 'Agent',
      avatar: listing.agent?.photoUrl ?? '/images/agents/ahmed-raza.jpg',
      phone: contact ? `${contact.countryCode}${contact.number}` : '',
    },
  };
}

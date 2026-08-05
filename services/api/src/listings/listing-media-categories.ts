// Server-side mirror of packages/core/src/utils/listingMediaCategories.ts —
// services/api doesn't depend on packages/core, so this is kept in lockstep
// by hand, same convention as REQUIRED_LISTING_DOCUMENT_TYPES-style
// constants duplicated across layers elsewhere in this codebase.

export interface ListingMediaCategoryRequirement {
  slug: string;
  label: string;
  minCount: number;
  required: boolean;
}

const MAX_DYNAMIC_ROOMS = 5;

// Note: 'Studio' (mobile/web's BEDROOM_OPTIONS) has no numeric
// representation and is sent as bedrooms=undefined, same as a plot with no
// bedrooms at all — this server-side gate can't distinguish the two, so a
// studio listing isn't required to have a dedicated bedroom photo here
// (the client-side taxonomy still shows/requires one before submit).
export function getRequiredMediaCategories(bedrooms?: number, bathrooms?: number): ListingMediaCategoryRequirement[] {
  const bedroomCount = bedrooms ? Math.min(bedrooms, MAX_DYNAMIC_ROOMS) : 0;
  const bathroomCount = bathrooms ? Math.min(bathrooms, MAX_DYNAMIC_ROOMS) : 0;
  const isResidential = bedroomCount > 0 || bathroomCount > 0;

  const categories: ListingMediaCategoryRequirement[] = [];

  if (isResidential) {
    categories.push({ slug: 'exterior', label: 'Exterior / Front View', minCount: 2, required: true });
    categories.push({ slug: 'living_room', label: 'Living Room', minCount: 2, required: true });
  }

  for (let i = 1; i <= bedroomCount; i++) {
    categories.push({ slug: `bedroom_${i}`, label: `Bedroom ${i}`, minCount: 2, required: true });
  }
  for (let i = 1; i <= bathroomCount; i++) {
    categories.push({ slug: `bathroom_${i}`, label: `Bathroom ${i}`, minCount: 1, required: true });
  }

  return categories;
}

export const LISTING_MEDIA_CATEGORY_SLUG_PATTERN = /^(exterior|living_room|kitchen|dining|balcony|parking|other|bedroom_\d+|bathroom_\d+)$/;

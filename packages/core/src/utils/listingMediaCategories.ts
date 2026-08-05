// Airbnb-style categorized mandatory media (Document Verification Phase 4).
// Required categories are derived from the listing's own bedrooms/bathrooms
// fields (already collected earlier in the same form) rather than property
// type — property_type_categories is admin-configurable data, not a fixed
// enum, so this naturally excludes plot/land listings (bedrooms/bathrooms
// left blank) without any hardcoded type list. Shared by web, mobile, and
// mirrored server-side in services/api (which doesn't depend on this
// package) — keep both in lockstep, same convention as
// REQUIRED_LISTING_DOCUMENT_TYPES-style constants elsewhere in this codebase.

export interface ListingMediaCategoryRequirement {
  slug: string;
  label: string;
  minCount: number;
  required: boolean;
}

// Caps '10+'/'6+' at a sane number of individually-labeled rooms — the rest
// of a large property's rooms fall under the optional "Other" category.
const MAX_DYNAMIC_ROOMS = 5;

function parseRoomCount(value: string): number {
  if (!value || value === 'Studio') return 0;
  const n = Number(value.replace('+', ''));
  return Number.isFinite(n) ? Math.min(n, MAX_DYNAMIC_ROOMS) : 0;
}

export function getRequiredMediaCategories(bedrooms: string, bathrooms: string): ListingMediaCategoryRequirement[] {
  const bedroomCount = parseRoomCount(bedrooms);
  const bathroomCount = parseRoomCount(bathrooms);
  const isResidential = bedrooms === 'Studio' || bedroomCount > 0 || bathroomCount > 0;

  const categories: ListingMediaCategoryRequirement[] = [];

  if (isResidential) {
    categories.push({ slug: 'exterior', label: 'Exterior / Front View', minCount: 2, required: true });
    categories.push({ slug: 'living_room', label: 'Living Room', minCount: 2, required: true });
  }

  if (bedrooms === 'Studio') {
    categories.push({ slug: 'bedroom_1', label: 'Studio', minCount: 2, required: true });
  } else {
    for (let i = 1; i <= bedroomCount; i++) {
      categories.push({ slug: `bedroom_${i}`, label: `Bedroom ${i}`, minCount: 2, required: true });
    }
  }

  for (let i = 1; i <= bathroomCount; i++) {
    categories.push({ slug: `bathroom_${i}`, label: `Bathroom ${i}`, minCount: 1, required: true });
  }

  categories.push(
    { slug: 'kitchen', label: 'Kitchen', minCount: 0, required: false },
    { slug: 'dining', label: 'Dining Area', minCount: 0, required: false },
    { slug: 'balcony', label: 'Balcony / Terrace', minCount: 0, required: false },
    { slug: 'parking', label: 'Parking', minCount: 0, required: false },
    { slug: 'other', label: 'Other', minCount: 0, required: false },
  );

  return categories;
}

export function getMissingMediaCategories(
  categories: ListingMediaCategoryRequirement[],
  mediaByCategory: Record<string, number>,
): ListingMediaCategoryRequirement[] {
  return categories.filter((c) => c.required && (mediaByCategory[c.slug] ?? 0) < c.minCount);
}

// Mirrored in services/api/src/listings/dto/create-listing.dto.ts — bedroom/
// bathroom slugs are numbered dynamically, so this is a regex, not a fixed
// class-validator @IsIn enum.
export const LISTING_MEDIA_CATEGORY_SLUG_PATTERN = /^(exterior|living_room|kitchen|dining|balcony|parking|other|bedroom_\d+|bathroom_\d+)$/;

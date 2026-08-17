import type { LucideIcon } from 'lucide-react';

export type ListingType = 'sale' | 'rent';

export interface Property {
  id: string;
  title: string;
  location: string;
  /** Pre-formatted in PKR at mapping time — static, not reactive to the
   *  viewer's currency preference. Kept for non-reactive contexts (share
   *  text, recently-viewed snapshots); any live price display should use
   *  `priceValue` with useFormattedPrice() instead. */
  price: string;
  /** Raw PKR amount — feed this to useFormattedPrice().format() for a
   *  live, currency-preference-aware display instead of the static
   *  `price` string above. */
  priceValue: number;
  image: string;
  listingType: ListingType;
  verified?: boolean;
  beds: number;
  baths: number;
  /** Always true square feet (converted via convertArea from the
   *  listing's real stored unit) — previously this was the listing's raw
   *  areaValue relabeled "sqft" regardless of its actual unit. Feed this
   *  to useFormattedArea().format(areaSqft, 'sqft') for a live,
   *  unit-preference-aware display. */
  areaSqft: number;
   /** Only set for the homepage's Most Visited carousel (GET /listings/trending). */
  viewCount?: number;
  /** Real listings.boost_tier — a spent Hot/Super Hot credit
   *  (POST /listings/:id/boost). 'basic' means not boosted. */
  boostTier?: 'basic' | 'premium' | 'hot' | 'super_hot';
  /** Real listings.story_expires_at — set by a spent Story credit
   *  (POST /listings/:id/story), null/past means no active story. */
  storyExpiresAt?: string | null;
}

// export type PropertyTypeOption = 'Villa' | 'Apartment' | 'Penthouse' | 'Townhouse' | 'House' | 'Bungalow';

// export type AmenityOption = 'Swimming Pool' | 'Parking' | 'Garden' | 'Gym' | 'Security' | 'Elevator';


export interface ListingProperty extends Property {
  // propertyType: PropertyTypeOption;
  /** Real listings.listing_number sequential reference — the human-facing
   *  "Listing ID" (rendered as JYD-##### throughout the app, see
   *  admin/listings/[id]/page.tsx), used by PropertyDetail.tsx's enquiry
   *  form template instead of the previous per-render fake hash. Only on
   *  ListingProperty (not the base Property every homepage card fixture
   *  also constructs) since it's only needed by the detail page. Optional
   *  because apps/web/data/listings.ts's unused legacy sample fixtures
   *  don't carry one — every real listing (via listingToListingProperty)
   *  always sets it. */
  listingNumber?: number;
   /** Real property_types.label (e.g. "Flat/Apartment") — Super Admin-managed, not a fixed enum. */
  propertyType: string;
  propertyTypeSlug: string;
  /** Real property_type_categories.slug ("residential" | "plot" | "commercial") — used to filter by category. */
  propertyTypeCategorySlug: string;
  furnished: boolean;
  // newProject: boolean;
  readyToMove: boolean;
  // amenities: AmenityOption[];
  lat: number;
  lng: number;
  /** Everything below is only used by the /listings/[slug] detail page. */
  description: string;
  /** Real amenities.label values — Super Admin-managed, not a fixed enum. */
  amenities: string[];
  yearBuilt: number;
  parkingSpots: number;
  ownership: 'Freehold' | 'Leasehold';
  agent: {
    name: string;
    role: string;
    avatar: string;
    phone: string;
    // The agent's active plan name (e.g. "Titanium"), rendered as a badge —
    // real Zameen listing pages show this on the agency card sidebar.
    // Optional (not just nullable) so apps/web/data/listings.ts's legacy
    // mock fixtures don't need updating too.
    subscriptionTierName?: string | null;
    /** Only populated on the single-listing detail fetch — see
     *  ListingAgentSummary's comment in packages/core/src/models. Always a
     *  real email when set (an agent is a real auth account). */
    email?: string | null;
  };
}

export interface Category {
  id: string;
  label: string;
  listingsCount: number;
  image: string;
  href: string;
}

export interface Stat {
  id: string;
  value: string;
  label: string;
}

export interface City {
  id: string;
  name: string;
  homesCount: number;
  image: string;
  href: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Only the first "Buy Property" tile is image-backed; everything else is a plain icon card. */
  image?: string;
}

export interface ComingProject {
  id: string;
  title: string;
  location: string;
  areaName: string;
  mapImage: string;
  price: string;
  description: string;
  image: string;
  beds: number;
  baths: number;
  areaSqft: number;
  agent: {
    name: string;
    avatar: string;
    phone: string;
  };
  href: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface Article {
  id: string;
  category: string;
  title: string;
  readTime: string;
  image: string;
  href: string;
}

export interface HowItWorksStep {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Where this card sits relative to the center house image. */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatar: string;
  rating: number; // 1-5
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

/**
 * Mirrors the fields the agent-portal Projects dashboard (@jayedaad/core's
 * `Project`) exposes — trimmed to what the public /projects/[slug] page
 * renders. Kept as a local, sample-data-only type instead of importing the
 * real `Project` since this page isn't wired to the API yet.
 */
export type ProjectStatusOption = 'planned' | 'under_construction' | 'ready' | 'draft';
export type ProjectVerificationOption = 'pending' | 'verified' | 'rejected' | 'draft';

export interface ProjectDeveloper {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  phone: string;
  whatsapp: string;
  city: string;
  /** Null when the developer has no email on file yet — DeveloperCard hides
   *  the Email quick-action rather than showing a broken mailto. */
  email: string | null;
}

export interface ProjectUnitType {
  id: string;
  label: string;
  propertyType: string;
  areaValueMin: number;
  areaValueMax: number;
  areaUnit: string;
  priceMin: number;
  priceMax: number;
  bedrooms: number;
  bathrooms: number;
}

export interface ProjectPaymentPlan {
  id: string;
  label: string;
  bookingPercent: number;
  installmentCount: number;
  installmentFrequency: string;
  balloonPaymentCount: number;
  description: string;
}

/**
 * What a project card needs on a *list* (browse grid, similar projects) —
 * deliberately lighter than DisplayProject: the real GET /projects search
 * endpoint only returns unitTypeCount (a number) and a nullable priceRange
 * on list rows, not the full unitTypes/paymentPlans/amenities arrays (those
 * are detail-only). Keeping this separate avoids either N+1-fetching every
 * card's full detail or faking arrays just to read `.length`.
 */
export interface ProjectCardData {
  id: string;
  slug: string;
  name: string;
  coverImageUrl: string;
  city: string;
  area: string;
  status: ProjectStatusOption;
  verificationStatus: ProjectVerificationOption;
  unitTypeCount: number;
  priceRangeMin: number;
  // Same shared-pool boost system listings have — see ProjectCard.tsx's
  // badge treatment, mirroring PropertyCard's.
  boostTier: 'basic' | 'premium' | 'hot' | 'super_hot';
  storyExpiresAt: string | null;
}

export interface DisplayProject {
  id: string;
  name: string;
  slug: string;
  developer: ProjectDeveloper;
  description: string;
  city: string;
  area: string;
  status: ProjectStatusOption;
  possessionDate: string;
  coverImageUrl: string;
  galleryImageUrls: string[];
  floorPlanUrls: string[];
  videoUrl: string | null;
  brochureUrl: string | null;
  verificationStatus: ProjectVerificationOption;
  unitTypes: ProjectUnitType[];
  paymentPlans: ProjectPaymentPlan[];
  amenities: string[];
  priceRange: { min: number; max: number };
}
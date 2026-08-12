import { httpClient } from './httpClient';
import {
  AreaUnit,
  BoostListingInput,
  ContactNumberType,
  FurnishingStatus,
  Listing,
  ListingDocument,
  ListingDocumentType,
  ListingPurpose,
  ListingStatus,
  TrendingListing,
} from '../models';

export interface ListingSearchFilters {
  listingId?: string;
  listingNumber?: number;
  city?: string;
  area?: string;
  propertyTypeSlug?: string;
  purpose?: ListingPurpose;
  bedrooms?: number;
  minBathrooms?: number;
  minAreaValue?: number;
  maxAreaValue?: number;
  areaUnit?: AreaUnit;
  minPrice?: number;
  maxPrice?: number;
  keyword?: string;
  furnishingStatus?: FurnishingStatus;
  hasVideo?: boolean;
  agencySlug?: string;
  sortBy?: 'relevance' | 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}

// Mirrors services/api/src/listings/listings.repository.ts::MyListingsFilters
// — confirmed real on the live Profolio "My Listings" filter panel.
export interface MyListingsFilters {
  status?: ListingStatus;
  // Super Admin's Listings page's Owner/Agent vs Agency split — filtered
  // server-side so pagination/totals stay correct at real scale (see
  // listings.repository.ts::findMine's agencyAgentIds pre-lookup).
  source?: 'owner_agent' | 'agency';
  // A category slug — property_type_categories is Super Admin-managed data
  // now, not a fixed enum, so this is deliberately `string`, not a union.
  propertyTypeCategory?: string;
  propertyTypeSlug?: string;
  purpose?: ListingPurpose;
  listingId?: string;
  listingNumber?: number;
  city?: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  minAreaValue?: number;
  maxAreaValue?: number;
  areaUnit?: AreaUnit;
  listedDateFrom?: string;
  listedDateTo?: string;
  page?: number;
  pageSize?: number;
}

// Mirrors services/api/src/listings/listings.repository.ts::PaginatedListings
// — GET /listings now returns a page, not a bare array (it was unbounded
// before this pass, a real bug at any real data volume).
export interface PaginatedListings {
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
}

// value is only meaningful for amenities with a valueUnit set on the
// catalog (e.g. "Parking Spaces: 2"). Only amenities linked to the
// listing's property-type category are accepted — validated server-side.
export interface CreateListingAmenityInput {
  slug: string;
  value?: number;
  textValue?: string;
}

// Mirrors services/api/src/listings/dto/create-listing.dto.ts — status is
// deliberately not a field here; the API always forces pending_verification.
export interface CreateListingInput {
  propertyTypeId: string;
  purpose: ListingPurpose;
  title: string;
  description?: string;
  price: number;
  city: string;
  area: string;
  society?: string;
  subArea?: string;
  bedrooms?: number;
  bathrooms?: number;
  kitchens?: number;
  floors?: number;
  areaValue: number;
  areaUnit: AreaUnit;
  yearBuilt?: number;
  floorLevel?: string;
  furnishingStatus?: FurnishingStatus;
  installmentAvailable?: boolean;
  readyForPossession?: boolean;
  advanceAmount?: number;
  numberOfInstallments?: number;
  monthlyInstallment?: number;
  balloonPaymentAvailable?: boolean;
  balloonPaymentAmount?: number;
  ballotingFeeApplicable?: boolean;
  ballotingFeeAmount?: number;
  possessionFeeApplicable?: boolean;
  possessionFeeAmount?: number;
  developmentFeeApplicable?: boolean;
  developmentFeeAmount?: number;
  contactNumbers?: { type: ContactNumberType; countryCode?: string; number: string }[];
  amenities?: CreateListingAmenityInput[];
  media?: CreateListingMediaInput[];
}

// url comes from a prior uploadListingMedia() call — attaches an
// already-uploaded photo/video to the listing being created.
export interface CreateListingMediaInput {
  url: string;
  type: 'image' | 'video';
  isCover?: boolean;
  sortOrder?: number;
  // Airbnb-style room category — see utils/listingMediaCategories.ts.
  category?: string;
}

export const listingsRepository = {
  searchPublic: async (filters: ListingSearchFilters): Promise<PaginatedListings> => {
    const { data } = await httpClient.get('/listings', { params: filters });
    return data;
  },

  // Role-aware on the API side: owners see what they submitted, agents see
  // what they're assigned to (the real Profolio "My Listings" page).
  findMine: async (filters: MyListingsFilters = {}): Promise<PaginatedListings> => {
    const { data } = await httpClient.get('/listings/mine', { params: filters });
    return data;
  },

  // Backs the status tab badges ("Active (0)", "Pending (0)", etc.).
  getMyStatusCounts: async (): Promise<Record<string, number>> => {
    const { data } = await httpClient.get('/listings/mine/status-counts');
    return data;
  },

  // The property detail page itself — confirmed real via a scraped Zameen
  // listing detail page.
  findById: async (listingId: string): Promise<Listing> => {
    const { data } = await httpClient.get(`/listings/${listingId}`);
    return data;
  },

  findSimilar: async (listingId: string): Promise<Listing[]> => {
    const { data } = await httpClient.get(`/listings/${listingId}/similar`);
    return data;
  },

   // Sitewide "most visited" ranking, off real listing_engagement_events
  // 'view' rows — GET /listings/trending.
  findMostViewed: async (limit?: number): Promise<TrendingListing[]> => {
    const { data } = await httpClient.get('/listings/trending', { params: { limit } });
    return data;
  },

  // Backs the agent dashboard's Calls/WhatsApp/SMS analytics, and now also
  // GET /listings/trending's "most visited" ranking via 'view' — public,
  // fire-and-forget from the caller (a failed track shouldn't block the
 // real tel:/wa.me/sms: action, or the page rendering for a 'view').
  // Mirrors services/api's TrackEngagementDto; 'email' is still not exposed
  // here — no listing-level email action exists yet for it to attach to.
  trackEngagement: async (
    listingId: string,
     input: { type: 'view' | 'call' | 'whatsapp' | 'sms'; platform: 'web' | 'mobile'; viewerSessionId: string },
  ): Promise<void> => {
    await httpClient.post(`/listings/${listingId}/track`, input);
  },

  listCities: async (): Promise<string[]> => {
    const { data } = await httpClient.get('/listings/locations/cities');
    return data;
  },

  listAreas: async (city: string): Promise<string[]> => {
    const { data } = await httpClient.get('/listings/locations/areas', { params: { city } });
    return data;
  },

  create: async (input: CreateListingInput): Promise<Listing> => {
    const { data } = await httpClient.post('/listings', input);
    return data;
  },

  // Same body/validation as create() — saved with status='draft' instead of
  // entering the verification queue. Pair with submitDraft() once the
  // agent/owner is ready to send it for review.
  createDraft: async (input: CreateListingInput): Promise<Listing> => {
    const { data } = await httpClient.post('/listings/draft', input);
    return data;
  },

  submitDraft: async (listingId: string): Promise<Listing> => {
    const { data } = await httpClient.post(`/listings/${listingId}/submit`);
    return data;
  },

  // Super Admin-only direct lifecycle override (expired/deleted/downgraded/
  // inactive, plus a staff-equivalent verified/rejected override) — distinct
  // from the verification queue's approve/reject/request-info action.
  setStatus: async (listingId: string, status: ListingStatus): Promise<Listing> => {
    const { data } = await httpClient.patch(`/listings/${listingId}/status`, { status });
    return data;
  },

  // Spends one of the agent's plan-granted Hot/Super Hot credits
  // (agent_credits, topped up on tier selection/renewal) to feature this
  // listing for a fixed window — the write path listing_boost_tier never
  // had before this pass.
  boostListing: async (listingId: string, input: BoostListingInput): Promise<Listing> => {
    const { data } = await httpClient.post(`/listings/${listingId}/boost`, input);
    return data;
  },

  // Spends one of the agent's plan-granted Refresh credits to bump this
  // listing's sort position within its current boost tier — no body, unlike
  // boostListing, since there's only one thing a refresh can do.
  refreshListing: async (listingId: string): Promise<Listing> => {
    const { data } = await httpClient.post(`/listings/${listingId}/refresh`);
    return data;
  },

  // Spends one of the agent's plan-granted Story credits to feature this
  // listing for a fixed 24h window — no body, same shape as refreshListing.
  postListingStory: async (listingId: string): Promise<Listing> => {
    const { data } = await httpClient.post(`/listings/${listingId}/story`);
    return data;
  },

  // Resets an expired listing (PlanLifecycleService's cron, once its plan's
  // listingDurationDays lapses) back to 'verified' with a fresh expiry.
  renewListing: async (listingId: string): Promise<Listing> => {
    const { data } = await httpClient.post(`/listings/${listingId}/renew`);
    return data;
  },

  // The write path Property Management's row actions were missing entirely
  // until now — self-scoped to the caller's own listing server-side (see
  // services/api/src/listings/listings.controller.ts::update).
  updateListing: async (listingId: string, input: Partial<CreateListingInput>): Promise<Listing> => {
    const { data } = await httpClient.patch(`/listings/${listingId}`, input);
    return data;
  },

  // Soft delete — server-side sets status to 'deleted' (an existing
  // ListingStatus with its own My Listings tab), not a hard row delete.
  deleteListing: async (listingId: string): Promise<Listing> => {
    const { data } = await httpClient.delete(`/listings/${listingId}`);
    return data;
  },

  // Real property-verification requirement — ID card front/back, ownership
  // proof, last utility bill. `file` is platform-specific (a browser File on
  // web, a { uri, name, type } asset object on React Native), left untyped
  // here since packages/core stays framework-agnostic.
  uploadDocument: async (listingId: string, documentType: ListingDocumentType, file: any): Promise<ListingDocument> => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    const { data } = await httpClient.post(`/listings/${listingId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  listDocuments: async (listingId: string): Promise<ListingDocument[]> => {
    const { data } = await httpClient.get(`/listings/${listingId}/documents`);
    return data;
  },

  // Uploads a photo/video ahead of the listing existing — the submit form
  // uploads as files are picked, then passes the returned urls into
  // create()'s `media` array. `file` is platform-specific (a browser File
  // on web, a { uri, name, type } asset object on React Native).
  uploadListingMedia: async (file: any): Promise<{ url: string; type: 'image' | 'video' }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await httpClient.post('/listings/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

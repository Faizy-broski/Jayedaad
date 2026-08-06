// Mirrors supabase/migrations/0001_init.sql — kept as plain TS interfaces
// (not generated) so both apps/web and apps/mobile can import them without
// depending on any Node-only DB client.

export type Role = 'super_admin' | 'verification_staff' | 'agent' | 'buyer' | 'owner';

// Verified against the real Profolio "My Listings" status tabs. Active/
// Pending/Rejected map onto verified/pending_verification/rejected;
// expired/deleted/inactive are unambiguous. 'downgraded' is real but its
// exact semantics couldn't be confirmed from a UI screenshot alone (see
// supabase/migrations/0001_init.sql for the inferred interpretation).
export type ListingStatus =
  | 'draft'
  | 'pending_verification'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'deleted'
  | 'downgraded'
  | 'inactive';
export type ListingPurpose = 'sale' | 'rent';
// Marla/Kanal lead the list — Jayedaad's primary market is Pakistan (Zameen.com
// is the primary schema reference; Zillow only contributed the living-area vs.
// lot-size and price-history disciplines layered on top).
export type AreaUnit = 'marla' | 'kanal' | 'sqyd' | 'sqft' | 'sqm' | 'acre';
export type FurnishingStatus = 'unfurnished' | 'semi_furnished' | 'furnished';
// Super Admin-managed taxonomy [Reqs §9] — Homes/Plots/Commercial are rows
// in property_type_categories, not a fixed enum (converted from one so
// Super Admin can CRUD the categories themselves, not just the types within
// them). Fetched from GET /taxonomy/property-type-categories.
export interface PropertyTypeCategory {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
}
// What a PropertyType/listing embeds inline — no id/sortOrder, same split as
// PropertyType vs PropertyTypeSummary below.
export interface PropertyTypeCategorySummary {
  slug: string;
  label: string;
}
// Verified against a real scraped Zameen.com listing detail page — 7
// categories, not a guessed set (see supabase/migrations/0005_taxonomy_seed.sql).
// 'plot_features' added in 0021_add_plot_features_category.sql — Plots'
// own tab (Corner, Balloted, Sui Gas, etc.), not applicable to Homes/Commercial.
export type AmenityCategory =
  | 'main_features'
  | 'rooms'
  | 'business_communication'
  | 'community_features'
  | 'healthcare_recreation'
  | 'nearby_locations'
  | 'other_facilities'
  | 'plot_features';
// Zameen's real listing-boost ranking (Basic/Premium/Hot/Super Hot "Value
// Booster" products) — independent of the owning agency's subscription tier.
export type ListingBoostTier = 'basic' | 'premium' | 'hot' | 'super_hot';

// Super Admin-managed taxonomy [Reqs §9] — not hardcoded, fetched from
// GET /taxonomy/property-types and /taxonomy/amenities. Includes `id`
// because submitting a listing needs the FK (CreateListingDto.propertyTypeId).
export interface PropertyType {
  id: string;
  slug: string;
  label: string;
  category: PropertyTypeCategorySummary;
}

// Full catalog type — includes `id` (needed to PATCH/DELETE a specific
// amenity) and `propertyTypeCategories` (which property types this amenity
// even applies to — confirmed a real gap: previously every amenity was
// offered for every property type regardless of relevance, e.g. Drawing
// Room on a Plot). `valueUnit` is set when this amenity carries a number on
// a listing (e.g. "spaces", "kms" — "Parking Spaces: 2", "Distance From
// Airport (kms)"); null means a plain boolean tag.
// valueType drives how the "Add Amenities" modal renders this field:
// 'boolean' -> a checkbox, 'number' -> a number input (labeled with
// valueUnit, e.g. "Distance From Airport (kms)"), 'text' -> a free-text
// input, 'select' -> a dropdown of `options` (e.g. Flooring -> Tiles/
// Marble/Wooden/Chip/Cement/Other).
export type AmenityValueType = 'boolean' | 'number' | 'text' | 'select';

export interface Amenity {
  id: string;
  slug: string;
  label: string;
  category: AmenityCategory;
  valueType: AmenityValueType;
  valueUnit: string | null;
  options: string[] | null;
  propertyTypeCategories: PropertyTypeCategorySummary[];
}

// Super Admin taxonomy CRUD inputs — mirror services/api/src/taxonomy/dto/*
// exactly. Reads (PropertyTypeCategory/PropertyType/Amenity above) are
// public; only these mutations are super_admin-only.
export interface CreatePropertyTypeCategoryInput {
  slug: string;
  label: string;
  sortOrder?: number;
}

export interface UpdatePropertyTypeCategoryInput {
  slug?: string;
  label?: string;
  sortOrder?: number;
}

export interface CreatePropertyTypeInput {
  slug: string;
  label: string;
  categoryId: string;
  sortOrder?: number;
}

export interface UpdatePropertyTypeInput {
  slug?: string;
  label?: string;
  categoryId?: string;
  sortOrder?: number;
}

export interface CreateAmenityInput {
  slug: string;
  label: string;
  category: AmenityCategory;
  valueType?: AmenityValueType;
  valueUnit?: string;
  options?: string[];
  propertyTypeCategoryIds?: string[];
  sortOrder?: number;
}

export interface UpdateAmenityInput {
  slug?: string;
  label?: string;
  category?: AmenityCategory;
  valueType?: AmenityValueType;
  valueUnit?: string;
  options?: string[];
  propertyTypeCategoryIds?: string[];
  sortOrder?: number;
}

// What a listing embeds inline (no id — search results never need to
// resubmit a listing's property type, only display it). Distinct from
// PropertyType so the two shapes don't silently pretend to be interchangeable.
export interface PropertyTypeSummary {
  slug: string;
  label: string;
  category: PropertyTypeCategorySummary;
}

export interface ListingMediaItem {
  url: string;
  type: 'image' | 'video';
  compressedUrl: string | null;
  isCover: boolean;
  sortOrder: number;
  // Airbnb-style room category (e.g. 'bedroom_1', 'living_room') — null for
  // pre-Phase-4 rows and optional-category uploads. See
  // utils/listingMediaCategories.ts.
  category: string | null;
}

// Confirmed real on the live Profolio "Post Listing" form (screenshot): a
// repeatable "+"-add Mobile field plus a separate Landline field — a
// listing carries its own contact numbers, not just the owner/agent's
// account phone.
export type ContactNumberType = 'mobile' | 'landline';

export interface ListingContactNumber {
  type: ContactNumberType;
  countryCode: string;
  number: string;
}

// What a Project embeds inline (project_amenities carries no value column,
// unlike listing_amenities — out of scope for this pass, see
// services/api/src/projects/projects.repository.ts). Distinct from the full
// catalog `Amenity`, same split as PropertyType vs PropertyTypeSummary.
export interface AmenitySummary {
  slug: string;
  label: string;
  category: AmenityCategory;
}

// What a listing embeds inline — same idea as AmenitySummary, plus the
// value fields listing_amenities does carry. `value` is this listing's
// actual number (e.g. 2 for Parking Spaces, distance in km for Distance
// From Airport); `textValue` is this listing's free text or chosen select
// option (e.g. "Mountain View", or "Tiles" for Flooring); `valueUnit`/
// `valueType`/`options` come from the catalog. All null/unset for a plain
// boolean-tag amenity.
export interface ListingAmenity extends AmenitySummary {
  valueType: AmenityValueType;
  valueUnit: string | null;
  options: string[] | null;
  value: number | null;
  textValue: string | null;
}

export interface Listing {
  id: string;
  // Real short/sequential reference number (Postgres identity column) — the
  // human-facing "Listing ID" shown/searched throughout the app. `id` (the
  // UUID) stays the real primary key for internal use (edit links, delete,
  // engagement tracking); this is what a person actually reads/types.
  listingNumber: number;
  title: string;
  description: string | null;
  price: string; // numeric serialized as string over the wire
  purpose: ListingPurpose;
  city: string;
  area: string;
  society: string | null;
  subArea: string | null;
  latitude: number | null;
  longitude: number | null;
  propertyType: PropertyTypeSummary;
  bedrooms: number | null;
  bathrooms: number | null;
  kitchens: number | null;
  floors: number | null; // total floor count of the house — distinct from floorLevel (a unit's position within a building)
  areaValue: string;
  areaUnit: AreaUnit;
  yearBuilt: number | null;
  floorLevel: string | null;
  furnishingStatus: FurnishingStatus | null;
  boostTier: ListingBoostTier;
  // Both confirmed real on the live Profolio form: two toggles under Price and Area.
  installmentAvailable: boolean;
  readyForPossession: boolean;
  advanceAmount: number | null;
  numberOfInstallments: number | null;
  monthlyInstallment: number | null;
  balloonPaymentAvailable: boolean;
  balloonPaymentAmount: number | null;
  ballotingFeeApplicable: boolean;
  ballotingFeeAmount: number | null;
  possessionFeeApplicable: boolean;
  possessionFeeAmount: number | null;
  developmentFeeApplicable: boolean;
  developmentFeeAmount: number | null;
  status: ListingStatus;
  createdAt: string;
  media: ListingMediaItem[];
  amenities: ListingAmenity[];
  contactNumbers: ListingContactNumber[];
  // Confirmed real on a scraped Zameen detail page's sidebar agency card
  // (agency name/logo, agent name, subscription-tier badge). Nullable — an
  // owner-only submission has no assigned agent.
  agent: ListingAgentSummary | null;
}

// What a listing embeds inline — subscriptionTierName is the agent's own
// active subscription's tier, not an agency-level field (this schema's
// subscriptions are keyed to agent_id, not agency_id).
export interface ListingAgentSummary {
  id: string;
  displayName: string | null;
  photoUrl: string | null;
  agency: { name: string; slug: string; logoUrl: string | null } | null;
  subscriptionTierName: string | null;
}

export type LeadStatus = 'new' | 'contacted' | 'negotiating' | 'closed' | 'lost';
export type LeadSource = 'chatbot' | 'contact_form' | 'call_request';
// Verified against a real Zameen.com "Contact Agent" form's "I am a:"
// dropdown — who the inquirer is, distinct from LeadSource (how they reached us).
export type LeadInquirerType = 'buyer_tenant' | 'agent' | 'other';

export interface Lead {
  id: string;
  listingId: string;
  agentId: string | null; // nullable — unassigned until J.Team assigns it [Dev Instr §3.2]
  name: string;
  phone: string;
  email: string;
  message: string;
  inquirerType: LeadInquirerType | null;
  wantsSimilarAlerts: boolean;
  status: LeadStatus;
  source: LeadSource;
  createdAt: string;
}

export interface LeadNote {
  id: string;
  leadId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface SubscriptionUsage {
  used: number;
  quota: number;
}

export interface AuthUser {
  id: string;
  role: Role;
  agentId?: string;
}

// --- Super Admin: User/Account Management (mirrors services/api/src/users/) ---
// Full account lifecycle [Reqs §9]: "Create, edit, suspend, and delete any
// user account, including Verification Staff and Agent accounts."

export interface AdminUser {
  id: string;
  role: Role;
  agentId: string | null;
  // Denormalized onto profiles [0002 migration] — email is always present
  // (every signup path uses email/password); displayName is only set when
  // the creator supplied one via CreateUserInput.displayName.
  email: string;
  displayName: string | null;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  role: Role;
  // Copied into profiles.display_name for every role (via the
  // handle_new_user() trigger); when role === 'agent' it's also used to
  // create the matching agent_profiles row atomically.
  displayName?: string;
  agencyId?: string;
}

// Backs the Super Admin "team members" screen — pulls just internal staff
// (e.g. { roles: ['super_admin', 'verification_staff'] }) instead of the
// full user base.
export interface ListUsersFilters {
  roles?: Role[];
}

// GET /admin/roles — "which role gets what dashboard access" reference.
// Purely descriptive (mirrors services/api/src/admin/role-access-descriptions.ts).
export interface RoleAccessDescription {
  role: Role;
  label: string;
  description: string;
  capabilities: string[];
}

export interface UpdateUserRoleInput {
  role: Role;
}

// --- Super Admin: Subscription Tier Management (mirrors services/api/src/subscriptions/) ---
// subscription_tiers.name is plain text, not a fixed enum — Super Admin
// creates plans with whatever name they choose.

export interface SubscriptionTier {
  id: string;
  name: string;
  listingQuota: number;
  price: number;
  // Depth/entitlement flags per tier, e.g. { analyticsDepth: 'full' }.
  analyticsDepth: Record<string, unknown>;
}

export interface CreateSubscriptionTierInput {
  name: string;
  listingQuota: number;
  price?: number;
  analyticsDepth: Record<string, unknown>;
}

export interface UpdateSubscriptionTierInput {
  name?: string;
  listingQuota?: number;
  price?: number;
  analyticsDepth?: Record<string, unknown>;
}

export interface Subscription {
  agentId: string;
  tierId: string;
  status: string;
  currentPeriodEnd: string | null;
  tier: SubscriptionTier;
}

export interface AssignSubscriptionInput {
  tierId: string;
  currentPeriodEnd?: string;
}

// --- Super Admin: Agent Credits write side (mirrors services/api/src/agents/dto/grant-credits.dto.ts) ---
// The write-side counterpart to AgentCredit (read-only, above) — GET
// /agents/:id/credits vs. PATCH /agents/:id/credits.

export interface GrantAgentCreditsInput {
  creditType: AgentCreditType;
  total?: number;
  used?: number;
}

// --- Super Admin: Listing lifecycle (mirrors services/api/src/listings/dto/set-status.dto.ts) ---
// Direct status transitions — expired/deleted/downgraded/inactive, plus a
// staff-equivalent override of verified/rejected. Distinct from the
// verification queue's approve/reject/request_info action.

export interface SetListingStatusInput {
  status: ListingStatus;
}

// --- Super Admin: Platform-wide analytics (mirrors services/api/src/admin/) ---
// Nothing else in the codebase rolls agents/listings/leads/users up across
// the whole platform — every other stats endpoint is scoped to one
// agent/agency.

export interface PlatformStats {
  usersByRole: Record<string, number>;
  agenciesByVerificationStatus: Record<string, number>;
  listingsByStatus: Record<string, number>;
  leadsByStatus: Record<string, number>;
  activeSubscriptionsByTier: Record<string, number>;
}

// One row per agent joining profile + agency + listing counts + subscription
// tier — the "see all agents' insights at a glance" capability.
export interface AgentOverview {
  id: string;
  displayName: string | null;
  phone: string | null;
  city: string | null;
  verificationStatus: string;
  agency: { id: string; name: string; slug: string } | null;
  subscription: { status: string; currentPeriodEnd: string | null; tierName: string | null } | null;
  listingCounts: { total: number; verified: number };
}

// --- Super Admin: Verification audit log (mirrors services/api/src/verification/) ---
// Read-back for verification_audit_log — every write is already atomically
// logged by record_verification_action(); this is the query side.

// Named distinctly from services/verificationRepository.ts's VerificationAction
// (a URL-path-segment type using a hyphen, 'request-info') — this is the
// literal public.verification_action Postgres enum value stored in
// verification_audit_log.action ('request_info', underscore).
export type VerificationAuditAction = 'approve' | 'reject' | 'request_info';

export interface VerificationAuditLogEntry {
  id: string;
  listingId: string;
  reviewerId: string;
  action: VerificationAuditAction;
  note: string | null;
  createdAt: string;
}

export interface PaginatedAuditLog {
  items: VerificationAuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Agencies & Reviews (mirrors 0006_agencies_and_reviews.sql) ---------------

export type AgencyVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null; // confirmed real on a scraped Zameen agency profile page
  businessHours: string | null; // plain display string, e.g. "Monday to Sunday, 9AM-6PM"
  verificationStatus: AgencyVerificationStatus;
  salesAssociateCount: number;
}

// Super Admin agency CRUD inputs — mirror services/api/src/agencies/dto/*
// exactly. Reads + create are pre-existing; verify/update/remove are the
// write-mechanisms this pass adds (every agency previously stuck 'pending'
// forever with no way out).
export interface CreateAgencyInput {
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  businessHours?: string;
  logoUrl?: string;
  // Optional — falls back to the DB default (1) when omitted, unlike
  // RegisterAgencyInput's mandatory version.
  salesAssociateCount?: number;
}

export interface UpdateAgencyInput {
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  businessHours?: string;
  logoUrl?: string;
  salesAssociateCount?: number;
}

export interface SetAgencyVerificationStatusInput {
  status: 'verified' | 'rejected';
}

// --- Agency self-management ("Agency Staff") --------------------------------
// An agency admin is still role 'agent' everywhere else — see
// AgentProfileSummary.isAgencyAdmin above and
// supabase/migrations/0023_agency_admin_flag.sql.

export interface AgencyStaffMember {
  id: string;
  displayName: string | null;
  phone: string | null;
  city: string | null;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isAgencyAdmin: boolean;
}

export interface CreateAgencyStaffInput {
  email: string;
  password: string;
  displayName?: string;
}

// Self-service agency registration (signup's "Agency" account type) —
// mirrors services/api/src/agencies/dto/register-agency.dto.ts exactly.
export interface RegisterAgencyInput {
  agencyName: string;
  agencySlug: string;
  agencyPhone?: string;
  agencyCity?: string;
  displayName?: string;
  agentPhone?: string;
  // Mandatory at onboarding — how many sales associates the agency expects
  // to add (see Document Verification spec, Phase 2).
  salesAssociateCount: number;
}

// Property inventory by type/purpose shown on a real Zameen agency page —
// computed at query time server-side, never a stored figure. byBoostTier
// confirmed real on the Profolio agent dashboard's Listings card (Active/
// For Sale/For Rent/Super Hot/Hot counts shown together).
export interface AgencyStats {
  forSaleCount: number;
  forRentCount: number;
  byPropertyType: { label: string; forSale: number; forRent: number }[];
  byBoostTier: { tier: ListingBoostTier; count: number }[];
}

// Public-facing agent card — independent agents have agency: null. The
// "Individual" badge on the real Profolio User Settings page needs no
// separate field here — it's derivable from agency === null.
export interface AgentProfileSummary {
  id: string;
  displayName: string | null;
  title: string | null; // staff role, e.g. "CEO" — confirmed real on a scraped agency staff list
  bio: string | null;
  phone: string | null; // the real Profolio form's "Mobile" field
  whatsapp: string | null;
  landline: string | null;
  city: string | null;
  address: string | null;
  photoUrl: string | null;
  agency: Agency | null;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  // Agency-scoped staff-management flag — an agency admin is still role
  // 'agent' everywhere else in the system (see agencyStaffRepository.ts).
  isAgencyAdmin: boolean;
}

export interface ApplyAsAgentInput {
  displayName?: string;
  phone?: string;
  city?: string;
}

// One agent_profiles row plus its document-completeness, as returned by the
// staff review queue (GET /agents/pending-verification).
export interface PendingAgentApplication extends AgentProfileSummary {
  documents: { required: string[]; uploaded: string[]; missing: string[] };
}

// Confirmed real on the Profolio "Preferences" page — didn't exist
// anywhere before this pass.
export interface UserPreferences {
  emailNotifications: boolean;
  newsletters: boolean;
  automatedReports: boolean;
  preferredCurrency: string;
  preferredAreaUnit: AreaUnit;
}

// Same shape as AgencyStats, scoped to one agent — GET /agents/:id/stats.
// Real Zameen agency pages show exactly this stat shape (counts +
// breakdown, never a listing grid); this gives an individual agent's
// profile (independent agents especially) the same treatment.
export interface AgentStats {
  forSaleCount: number;
  forRentCount: number;
  byPropertyType: { label: string; forSale: number; forRent: number }[];
  byBoostTier: { tier: ListingBoostTier; count: number }[];
}

// Confirmed real on the Profolio agent dashboard's Analytics card: 7
// metrics (Views/Clicks/Leads/Calls/WhatsApp/SMS/Emails), filterable by
// purpose and date range — GET /agents/:id/analytics (private, own data only).
export interface AgentAnalytics {
  views: number;
  clicks: number;
  leads: number;
  calls: number;
  whatsapp: number;
  sms: number;
  emails: number;
}

// Same real listing_engagement_events/leads rows AgentAnalytics sums into
// one total, bucketed by calendar day instead — backs mobile's Dashboard
// charts (Listing performance / Leads captured).
export interface AgentDailyAnalyticsPoint {
  date: string;
  views: number;
  leads: number;
}

export type ListingEngagementType = 'view' | 'click' | 'call' | 'whatsapp' | 'sms' | 'email';

// Confirmed real on the Profolio "Quota and Credits" card: separate
// Available/Used/Total pools per action type, not a single quota number.
export type AgentCreditType = 'listing_quota' | 'refresh' | 'hot' | 'super_hot';

export interface AgentCredit {
  creditType: AgentCreditType;
  total: number;
  used: number;
  available: number;
}

export interface AgentReview {
  id: string;
  agentId: string;
  reviewerId: string;
  rating: number; // 1-5
  body: string | null;
  createdAt: string;
}

// --- Favorites & Saved Searches (mirrors 0007_favorites_and_saved_searches.sql) ---

// listing is the joined summary FavoritesRepository.list() actually selects
// (id/title/price/city/area/status) — nullable since a favorited listing
// could theoretically be deleted out from under the favorite row.
export interface Favorite {
  id: string;
  listingId: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    price: number;
    city: string;
    area: string;
    status: ListingStatus;
  } | null;
}

export type AlertFrequency = 'instant' | 'daily' | 'weekly' | 'off';

export interface SavedSearch {
  id: string;
  name: string | null;
  filters: ListingSearchFiltersJson;
  alertFrequency: AlertFrequency;
  lastNotifiedAt: string | null;
  createdAt: string;
}

// Same filter shape GET /listings accepts (see listingsRepository.ts) —
// kept separate from ListingSearchFilters so this file has no dependency on
// the services layer.
export interface ListingSearchFiltersJson {
  city?: string;
  area?: string;
  propertyTypeSlug?: string;
  purpose?: ListingPurpose;
  bedrooms?: number;
  minBathrooms?: number;
  minAreaValue?: number;
  maxAreaValue?: number;
  areaUnit?: AreaUnit;
}

// --- Projects (mirrors 0008_projects.sql) --------------------------------------

export type ProjectStatus = 'planned' | 'under_construction' | 'ready' | 'draft';
// Publish gate — mirrors AgencyVerificationStatus's simple 3-state shape.
// An agent-authored project starts 'pending' and is invisible to public
// search until a Super Admin approves it; a super_admin-authored one is
// auto-'verified'. See supabase/migrations/0025_project_verification_status.sql.
export type ProjectVerificationStatus = 'pending' | 'verified' | 'rejected' | 'draft';

// Promoted from a plain `developerName` string to a first-class entity —
// confirmed real on the Zameen New Projects page's "Select Developers"
// search dropdown and "Featured Developers" section (logo, phone, WhatsApp,
// project count), not just a text label.
export interface Developer {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
}

// GET /developers/:slug embeds a computed project count — same "compute at
// query time, never store" discipline as AgencyStats/AgentStats.
export interface DeveloperWithStats extends Developer {
  projectCount: number;
}

export interface CreateDeveloperInput {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
}

export interface UpdateDeveloperInput {
  name?: string;
  logoUrl?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
}

// What a project embeds inline — no bio/description, mirrors the
// PropertyType/PropertyTypeSummary and Agency/AgentProfileSummary splits
// already used elsewhere in this file.
export interface DeveloperSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
}

// --- Blog / Property Tips CMS ---------------------------------------------------
// Replaces the hardcoded mock data both homepages used to show. Super
// Admin-authored (TipTap HTML content), draft/publish workflow.

export type BlogPostStatus = 'draft' | 'published';

// Admin-managed lookup table, not a hardcoded enum — same "Super Admin
// manages taxonomy at runtime" convention as PropertyTypeCategory.
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  category: BlogCategory | null;
  excerpt: string | null;
  content: string; // TipTap HTML
  coverImageUrl: string | null;
  readTime: string | null;
  status: BlogPostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogPostInput {
  title: string;
  slug: string;
  content: string;
  categoryId?: string;
  excerpt?: string;
  coverImageUrl?: string;
  readTime?: string;
  status?: BlogPostStatus;
}

export interface UpdateBlogPostInput {
  title?: string;
  content?: string;
  categoryId?: string;
  excerpt?: string;
  coverImageUrl?: string;
  readTime?: string;
}

export interface CreateBlogCategoryInput {
  name: string;
  slug: string;
}

// Server-side paginated admin list result — same shape as ListingSearchResult,
// backs the admin/blog table (thousands of posts can't ship in one response).
export interface BlogPostListResult {
  items: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
}

// What the homepage's Market Insights/Property Tips sections embed — no
// content/status, mirrors DeveloperSummary's "display-relevant fields only" split.
export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  category: BlogCategory | null;
  coverImageUrl: string | null;
  readTime: string | null;
  publishedAt: string | null;
}

// Verified against a real Zameen "New Projects" page: price and area are
// both shown as ranges per unit type, with bedrooms/bathrooms listed too.
// propertyType links each unit type into the same Super-Admin-managed
// taxonomy already built for regular listings (property_types) — confirmed
// real via the "Browse Projects by Category" bar (Flats/Plots/Shops/Houses/...).
export interface ProjectUnitType {
  id: string;
  label: string;
  propertyType: PropertyTypeSummary;
  areaValueMin: string | null;
  areaValueMax: string | null;
  areaUnit: AreaUnit;
  priceMin: string | null;
  priceMax: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
}

// Structured installment plan — a real, prominent feature of Zameen
// new-development pages, not present on regular resale listings.
export interface ProjectPaymentPlan {
  id: string;
  label: string;
  bookingPercent: number | null;
  installmentCount: number | null;
  installmentFrequency: string | null;
  balloonPaymentCount: number | null;
  planDocumentUrl: string | null;
  description: string | null;
}

export interface ProjectPriceRange {
  min: number;
  max: number;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  developer: DeveloperSummary;
  description: string | null;
  city: string;
  area: string;
  status: ProjectStatus;
  possessionDate: string | null;
  coverImageUrl: string | null;
  galleryImageUrls: string[];
  floorPlanUrls: string[];
  videoUrl: string | null;
  brochureUrl: string | null;
  verificationStatus: ProjectVerificationStatus;
  // The auth user id of whoever created this project — null for legacy
  // rows that predate this column. Used client-side to decide whether an
  // agent viewing /projects/[id] gets an editable form or a read-only one
  // (see apps/web/app/(agent)/projects/[id]/page.tsx).
  createdBy: string | null;
  // Always present — a real count from the DB (see
  // ProjectsRepository.mapProjectRow's `project_unit_types (count)` embed),
  // unlike unitTypes below.
  unitTypeCount: number;
  // Only populated on the single-project detail endpoints (findBySlug/
  // findById) — search/manage list rows omit these entirely rather than
  // eagerly joining every project's full child rows, so treat as absent
  // (not just empty) on a Project that came from a search/list response.
  unitTypes?: ProjectUnitType[];
  paymentPlans?: ProjectPaymentPlan[];
  amenities?: AmenitySummary[];
  // Computed at query time from unit types, never stored — same principle
  // as every other stats figure on this platform.
  priceRange: ProjectPriceRange | null;
}

// GET /projects search — confirmed real on the Zameen New Projects search
// page: City, Property Type (via the category taxonomy), Budget Range, Area
// Range, Project Title (keyword) and Developer filters, plus sort/pagination.
// Mirrors ListingSearchFilters in services/listingsRepository.ts.
export interface ProjectSearchFilters {
  city?: string;
  status?: ProjectStatus;
  propertyTypeSlug?: string;
  developerSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minAreaValue?: number;
  maxAreaValue?: number;
  areaUnit?: AreaUnit;
  keyword?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}

// Mirrors services/api/src/projects/projects.repository.ts::PaginatedProjects.
export interface PaginatedProjects {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
}

// Backs "Browse Projects by City" (Islamabad 285, Lahore 219, ...).
export interface ProjectCityCount {
  city: string;
  count: number;
}

// Backs "Browse Projects by Category" (Flats 486, Plots 427, ...).
export interface ProjectCategoryCount {
  propertyType: PropertyTypeSummary;
  count: number;
}

// Mirrors services/api/src/projects/dto/create-project.dto.ts —
// developerId replaces the old free-text developerName; unitTypes gain
// propertyTypeSlug (resolved server-side to property_type_id).
export interface CreateProjectUnitTypeInput {
  label: string;
  propertyTypeSlug: string;
  areaValueMin?: number;
  areaValueMax?: number;
  areaUnit: AreaUnit;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export interface CreateProjectPaymentPlanInput {
  label: string;
  bookingPercent?: number;
  installmentCount?: number;
  installmentFrequency?: string;
  balloonPaymentCount?: number;
  planDocumentUrl?: string;
  description?: string;
}

export interface CreateProjectInput {
  name: string;
  slug: string;
  developerId: string;
  description?: string;
  city: string;
  area: string;
  status?: ProjectStatus;
  possessionDate?: string;
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  floorPlanUrls?: string[];
  videoUrl?: string;
  brochureUrl?: string;
  unitTypes?: CreateProjectUnitTypeInput[];
  paymentPlans?: CreateProjectPaymentPlanInput[];
  amenitySlugs?: string[];
}

export interface SetProjectVerificationStatusInput {
  status: 'verified' | 'rejected';
}

// Full-page-form edit input — unitTypes/paymentPlans/amenitySlugs, when
// present, replace the project's existing rows entirely server-side (see
// ProjectsRepository.update), same as CreateProjectInput's shape.
export interface UpdateProjectInput {
  name?: string;
  slug?: string;
  developerId?: string;
  description?: string;
  city?: string;
  area?: string;
  status?: ProjectStatus;
  possessionDate?: string;
  coverImageUrl?: string;
  galleryImageUrls?: string[];
  floorPlanUrls?: string[];
  videoUrl?: string;
  brochureUrl?: string;
  unitTypes?: CreateProjectUnitTypeInput[];
  paymentPlans?: CreateProjectPaymentPlanInput[];
  amenitySlugs?: string[];
}

// Shared ownership/verification rules — mirrors the server-side checks in
// services/api/src/projects/projects.controller.ts's assertOwnProject/
// assertCanDeleteProject exactly, so web (ProjectsListView.tsx) and mobile
// (MyProjectsScreen.tsx) enforce the identical business rule instead of
// each re-deriving it. These are permission *predicates* only (what the UI
// should show/allow) — the API is still the actual source of truth and
// re-checks on every request regardless of what the client renders.
export function canEditProject(project: Project, role: Role | undefined, userId: string | undefined): boolean {
  if (role === 'super_admin') return true;
  return role === 'agent' && !!userId && project.createdBy === userId;
}

// An agent may delete their own project only before it's approved — once
// verification_status is 'verified' it's live/public, so removing it
// becomes a Super Admin call.
export function canDeleteProject(project: Project, role: Role | undefined, userId: string | undefined): boolean {
  if (role === 'super_admin') return true;
  return role === 'agent' && !!userId && project.createdBy === userId && project.verificationStatus !== 'verified';
}

// --- Notifications (mirrors 0009_notifications.sql) ----------------------------

export type NotificationType =
  | 'price_drop'
  | 'new_match'
  | 'inquiry_reply'
  | 'verification_status'
  | 'lead_assigned'
  | 'reminder';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  relatedListingId: string | null;
  relatedLeadId: string | null;
  readAt: string | null;
  createdAt: string;
}

// --- Verification Documents (mirrors 0012_documents.sql) -----------------------
// Real business requirement: property/listing verification requires ID card
// front+back, ownership proof, and a last utility bill; onboarding a
// company/independent agent requires company registration, owner's ID card,
// and a tax certificate. Only PNG/JPEG/PDF are accepted, enforced
// server-side against the actual uploaded file's MIME type (the first real
// file-upload capability in this codebase). `url` is always a short-lived
// signed URL (documents live in a private Storage bucket, not a public one
// like photo_url/logo_url) — re-fetch the document to get a fresh link.

export type ListingDocumentType = 'id_card_front' | 'id_card_back' | 'ownership_proof' | 'utility_bill';
export type OnboardingDocumentType = 'company_registration' | 'owner_id_card' | 'tax_certificate';

export interface ListingDocument {
  id: string;
  documentType: ListingDocumentType;
  url: string;
  uploadedAt: string;
}

// Onboarding documents (company registration, owner's ID card, tax
// certificate) — used by both agencies and independent agents (agents
// stand in as their own "company"), distinct from ListingDocument above
// (a different document-type set, for property verification).
export interface OnboardingDocument {
  id: string;
  documentType: OnboardingDocumentType;
  url: string;
  uploadedAt: string;
}

export interface OnboardingDocument {
  id: string;
  documentType: OnboardingDocumentType;
  url: string;
  uploadedAt: string;
}

// Backs the hard gate on verification/onboarding approval — the API
// rejects the approve/verify action if `missing` is non-empty.
export interface DocumentCompleteness<T extends string = string> {
  required: T[];
  uploaded: T[];
  missing: T[];
}

// The write path added by this pass — agent_profiles.verification_status
// previously had no endpoint to ever set it. Mirrors the existing
// SetAgencyVerificationStatusInput.
export interface SetAgentVerificationStatusInput {
  status: 'verified' | 'rejected';
}

// --- Owner Identity Verification (Document Verification Phase 1) ---------------
// A one-time CNIC+selfie check for individual owners, staff-reviewed exactly
// like agent verification — separate from ListingDocumentType above, which
// is now just per-listing ownership proof (id_card_front/back moved here).

export type OwnerIdentityDocumentType = 'cnic_front' | 'cnic_back' | 'selfie';
export type OwnerVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface OwnerIdentityDocument {
  id: string;
  documentType: OwnerIdentityDocumentType;
  url: string;
  uploadedAt: string;
}

// status is null when the owner has never uploaded anything yet — distinct
// from 'pending' (uploaded, awaiting staff review).
export interface OwnerVerificationSummary {
  status: OwnerVerificationStatus | null;
  documents: OwnerIdentityDocument[];
  reviewedAt: string | null;
}

export interface PendingOwnerVerification {
  userId: string;
  displayName: string | null;
  email: string | null;
  status: OwnerVerificationStatus;
  createdAt: string;
  documents: DocumentCompleteness<OwnerIdentityDocumentType>;
}

// --- Appointments / Calendar (Document Verification Phase 3) -------------------
// "Book a Visit" on a listing also creates one of these ('requested') on the
// listing's agent's calendar, alongside the lead it already creates — see
// leadsRepository.ts's CreateLeadInput.isVisitRequest. Agents can also
// create/manage appointments manually.

export type AppointmentStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  agentId: string | null;
  ownerId: string | null;
  leadId: string | null;
  listingId: string | null;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: string;
}

export interface CreateAppointmentInput {
  title: string;
  scheduledAt: string;
  durationMinutes?: number;
  leadId?: string;
  listingId?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface UpdateAppointmentInput {
  title?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  notes?: string;
  status?: AppointmentStatus;
}

// --- Agency-wide staff analytics (Document Verification Phase 3) ---------------
// Backs the Agency Admin's "full visibility to their overall performance,
// analytics, and their sales associates" dashboard section — GET
// /agencies/:id/analytics, admin-only server-side.

export interface AgencyStaffAnalyticsEntry {
  agentId: string;
  displayName: string | null;
  isAgencyAdmin: boolean;
  stats: AgentStats;
  analytics: AgentAnalytics;
  closingsCount: number;
}

export interface AgencyStaffAnalytics {
  associates: AgencyStaffAnalyticsEntry[];
  totals: {
    forSaleCount: number;
    forRentCount: number;
    leads: number;
    views: number;
    closingsCount: number;
  };
}

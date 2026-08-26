// Mirrors supabase/migrations/0001_init.sql — kept as plain TS interfaces
// (not generated) so both apps/web and apps/mobile can import them without
// depending on any Node-only DB client.

export type Role = 'super_admin' | 'verification_staff' | 'agent' | 'buyer' | 'owner';

// Verified against the real Profolio "My Listings" status tabs. Active/
// Pending/Rejected map onto verified/pending_verification/rejected;
// expired/deleted/inactive are unambiguous. 'downgraded' is real but its
// exact semantics couldn't be confirmed from a UI screenshot alone (see
// supabase/migrations/0001_init.sql for the inferred interpretation).
// 'sold'/'rented' added by supabase/migrations/0064_deals_and_commission.sql
// — terminal end-states written by DealsRepository.markSold/markRented
// (Mark Sold/Mark Rented), distinct from every other status here.
export type ListingStatus =
  | 'draft'
  | 'pending_verification'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'deleted'
  | 'downgraded'
  | 'inactive'
  | 'sold'
  | 'rented';
export type ListingPurpose = 'sale' | 'rent';
// Explicit poster identity, chosen at submission — stored on
// listings.poster_type (see the poster_type migration), decoupled from
// profiles.role. A clean 3-way partition: 'owner' (anyone, including an
// agent listing a property they personally own), 'agent' (independent
// agents only, no agency), 'agency' (agency-affiliated agents only).
export type ListingPosterType = 'owner' | 'agent' | 'agency';
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
// Booster" products). 'hot'/'super_hot' are spent from the agent's plan-
// granted agent_credits allotment (POST /listings/:id/boost) — 'premium'
// has no spend path defined yet, stays reachable only via direct DB/admin
// action.
export type ListingBoostTier = 'basic' | 'premium' | 'hot' | 'super_hot';

export interface BoostListingInput {
  boostTier: Extract<ListingBoostTier, 'hot' | 'super_hot'>;
}

// Spends from the SAME shared agent_credits pool BoostListingInput does —
// no separate project-specific credit type, reuses ListingBoostTier rather
// than a parallel ProjectBoostTier (see services/api/src/projects/
// projects.repository.ts's boost() for the write path).
export interface BoostProjectInput {
  boostTier: Extract<ListingBoostTier, 'hot' | 'super_hot'>;
}

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
  // Set when a Hot/Super Hot credit is spent (POST /listings/:id/boost) —
  // boostTier reverts to 'basic' once this passes (PlanLifecycleService's
  // cron), so a boost is a fixed window, not permanent.
  boostExpiresAt: string | null;
  // Set when a Refresh credit is spent (POST /listings/:id/refresh) — used
  // as a secondary sort key ahead of createdAt so a refreshed listing
  // outranks older un-refreshed ones at the same boostTier. Unlike
  // boostExpiresAt, this never reverts on its own.
  refreshedAt: string | null;
  // Set when a Story credit is spent (POST /listings/:id/story) — a
  // 24-hour featured placement, cleared back to null by
  // PlanLifecycleService's cron once it passes. Unlike boostTier, this
  // isn't a rank against other listings, just an on/off flag.
  storyExpiresAt: string | null;
  // Set on approval/renewal from the assigned agent's plan's
  // listingDurationDays — null means unlimited (never expires). Once this
  // passes, PlanLifecycleService's cron sets status to 'expired';
  // POST /listings/:id/renew resets both this and status.
  expiresAt: string | null;
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
  // Every listing always has one, post-poster_type-migration backfill.
  posterType: ListingPosterType;
  createdAt: string;
  media: ListingMediaItem[];
  amenities: ListingAmenity[];
  contactNumbers: ListingContactNumber[];
  // Confirmed real on a scraped Zameen detail page's sidebar agency card
  // (agency name/logo, agent name, subscription-tier badge). Nullable — an
  // owner-only submission has no assigned agent.
  agent: ListingAgentSummary | null;
}

// GET /listings/trending only — a real per-listing 'view' event count off
// listing_engagement_events, computed at query time (never stored) like
// every other stats figure on this platform. Regular Listing responses
// (findPublic/findById/findSimilar) never carry this.
export interface TrendingListing extends Listing {
  viewCount: number;
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
  // Only ever populated on GET /listings/:id (single detail) — never on
  // search/list results, to avoid an admin-API lookup per row. Always a
  // real email when present (an agent is a real auth account, unlike a
  // developer catalog entry), so undefined/null here just means "not
  // fetched on this endpoint", not "this agent has no email".
  email?: string | null;
}

export type LeadStatus = 'new' | 'contacted' | 'negotiating' | 'closed' | 'lost';

// Mirrors services/api/src/leads/leads.repository.ts's ALLOWED_STATUS_TRANSITIONS
// exactly — closed/lost are terminal, contacted/negotiating can't go back to
// "new". The API is the source of truth and rejects anything outside this
// table with a 400; sharing it here lets both apps/web and apps/mobile gray
// out invalid targets client-side instead of letting a tap round-trip into
// an error toast.
export const LEAD_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'negotiating', 'closed', 'lost'],
  contacted: ['negotiating', 'closed', 'lost'],
  negotiating: ['contacted', 'closed', 'lost'],
  closed: [],
  lost: [],
};
export type LeadSource = 'chatbot' | 'contact_form' | 'call_request';
// Verified against a real Zameen.com "Contact Agent" form's "I am a:"
// dropdown — who the inquirer is, distinct from LeadSource (how they reached us).
export type LeadInquirerType = 'buyer_tenant' | 'agent' | 'other';
// 'opportunity_converted' added alongside the opportunities feature
// (0067_opportunities.sql) — the system-generated timeline entry a lead
// gets when it's promoted via "Convert to Opportunity".
export type LeadActivityType = 'note' | 'status_change' | 'call' | 'assignment' | 'email' | 'whatsapp' | 'opportunity_converted';

export interface Lead {
  id: string;
  // Exactly one of these is ever set — a lead is either about a listing or
  // a project, never both/neither (mirrors the DB's
  // leads_listing_or_project_chk constraint, 0044_leads_project_enquiries.sql).
  listingId: string | null;
  projectId: string | null;
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
  // Embedded by GET /crm/leads' select('*, lead_status_history(*),
  // lead_notes(*), lead_activity(*)') — previously fetched by the backend
  // and dropped on the floor by the client (no fields for them here, and no
  // UI ever read them), making note-taking effectively write-only.
  notes: LeadNote[];
  statusHistory: LeadStatusHistoryEntry[];
  activity: LeadActivityEntry[];
}

export interface LeadNote {
  id: string;
  leadId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface LeadStatusHistoryEntry {
  id: string;
  leadId: string;
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus;
  changedBy: string;
  changedAt: string;
}

export interface LeadActivityEntry {
  id: string;
  leadId: string;
  type: LeadActivityType;
  // References the lead_notes/lead_status_history/lead_assignments row this
  // entry describes — plain text, no FK (0001_init.sql's lead_activity.ref_id
  // is untyped), so this can't be joined further client-side, only displayed.
  refId: string | null;
  createdAt: string;
}

// Server-side paginated — mirrors BlogPostListResult/ListingSearchResult's
// {items, total, page, pageSize} shape.
export interface LeadListResult {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

// --- Opportunities: the real pre-close pipeline object (0067_opportunities.sql),
// sitting between Lead (raw inquiry) and Deal (closed-won revenue ledger,
// see DealType/Deal below) — mirrors services/api/src/opportunities/. ---

export type OpportunityStage = 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'won' | 'lost';

// Mirrors services/api/src/opportunities/opportunities.repository.ts's
// ALLOWED_STAGE_TRANSITIONS exactly — forward-only through the live
// stages, plus any non-terminal stage can jump straight to 'lost'; 'won'/
// 'lost' are terminal. Shared here so web/mobile can gray out invalid
// kanban drop targets client-side, same reasoning as LEAD_STATUS_TRANSITIONS.
export const OPPORTUNITY_STAGE_TRANSITIONS: Record<OpportunityStage, OpportunityStage[]> = {
  qualification: ['needs_analysis', 'proposal', 'negotiation', 'won', 'lost'],
  needs_analysis: ['proposal', 'negotiation', 'won', 'lost'],
  proposal: ['negotiation', 'won', 'lost'],
  negotiation: ['won', 'lost'],
  won: [],
  lost: [],
};

export interface Opportunity {
  id: string;
  // Nullable — an opportunity can be promoted from a lead ("Convert to
  // Opportunity") or created directly with no source lead (a walk-in/
  // referral); both are real, supported paths.
  leadId: string | null;
  listingId: string | null;
  projectId: string | null;
  agentId: string;
  agencyId: string | null;
  dealType: DealType;
  name: string;
  value: number;
  stage: OpportunityStage;
  probability: number;
  expectedCloseDate: string;
  // Set once stage moves to 'lost' — the reason is required at that point
  // (see OPPORTUNITY_STAGE_TRANSITIONS' usage in the stage-change UI).
  lostReason: string | null;
  // Set once this opportunity is won and a matching `deals` row exists.
  dealId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stageHistory: OpportunityStageHistoryEntry[];
}

export interface OpportunityStageHistoryEntry {
  id: string;
  opportunityId: string;
  fromStage: OpportunityStage | null;
  toStage: OpportunityStage;
  changedBy: string;
  changedAt: string;
}

export interface OpportunityListResult {
  items: Opportunity[];
  total: number;
  page: number;
  pageSize: number;
}

// Real interaction history — a logged call/email/whatsapp/meeting against a
// lead and/or an opportunity (0070_activity_timeline_tables.sql). Distinct from
// LeadActivityEntry (the lightweight lead_activity pointer row, type +
// refId only): this is the actual logged content, rendered by
// ActivityTimeline (web) / ActivityTimeline (mobile).
// Funnel & conversion analytics (Phase 4 of the CRM maturity build-out) —
// GET /crm/opportunities/funnel. 'lost' is excluded from stageConversion's
// forward-progress ordering (it's a separate exit metric, see winLoss);
// conversionFromPrevious is null (never Infinity/NaN) when zero
// opportunities reached the prior stage.
export interface OpportunityFunnelStageConversion {
  stage: OpportunityStage;
  reachedCount: number;
  conversionFromPrevious: number | null;
}

export interface OpportunityFunnelStats {
  stageConversion: OpportunityFunnelStageConversion[];
  openPipelineValue: number;
  openPipelineCount: number;
  won: number;
  lost: number;
  winLossRatio: number | null;
  forecastedRevenue: number;
}

export interface ActivityLogEntry {
  id: string;
  leadId: string | null;
  opportunityId: string | null;
  type: LeadActivityType;
  loggedBy: string;
  occurredAt: string;
  summary: string;
  outcome: string | null;
  createdAt: string;
}

// A reminder is always lead-scoped (0001_init.sql's reminders.lead_id is
// `not null`) — fired by services/api's RemindersService (a @Cron job, not
// real-time), which creates a `notifications` row for the lead's assigned
// agent once remind_at passes. `channel` is stored/shown but delivery is
// always in-app today regardless of its value.
export type ReminderChannel = 'in_app' | 'push' | 'email';

export interface Reminder {
  id: string;
  leadId: string;
  remindAt: string;
  channel: ReminderChannel;
  firedAt: string | null;
}

export interface CreateReminderInput {
  remindAt: string;
  channel: ReminderChannel;
}

// Self-scoped personal to-do, optionally linked to a lead (a "follow up on
// this" task) — unlike Lead/Reminder, ownerId IS the access scope, no
// agency-sharing concept.
export interface Task {
  id: string;
  leadId: string | null;
  ownerId: string;
  title: string;
  dueAt: string | null;
  completedAt: string | null;
}

export interface CreateTaskInput {
  title: string;
  dueAt?: string;
  leadId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  dueAt?: string;
}

export interface SubscriptionUsage {
  used: number;
  quota: number;
  // Separate counter from listings' used/quota — see
  // EntitlementsService.getProjectUsage on the backend.
  projectUsed: number;
  projectQuota: number;
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
  // Mirrors auth.users.banned_until (set via the Admin API's ban_duration —
  // see users.repository.ts::suspend/unsuspend) — null when active, set to
  // the suspension timestamp otherwise. Kept on profiles rather than
  // queried from Supabase Auth per row so the Users list can reflect real
  // status cheaply.
  suspendedAt: string | null;
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
  // Agent-only — same fields the self-service become-an-agent flow
  // collects (ApplyAsAgentInput below).
  phone?: string;
  city?: string;
  // Deferred-upload, any role — same convention as CreateAgencyStaffInput's
  // photoUrl: the entity doesn't exist yet when a file is picked, so the
  // Add User modal uploads via agentsRepository.uploadStandaloneAvatar()
  // first and passes the resulting URL here at creation time.
  photoUrl?: string;
}

// Backs the Super Admin "team members" screen — pulls just internal staff
// (e.g. { roles: ['super_admin', 'verification_staff'] }) instead of the
// full user base.
export interface ListUsersFilters {
  roles?: Role[];
  // Matches against display name/email server-side — searches across every
  // page, not just whatever page is currently loaded. Only applies when
  // page/pageSize is also passed (see ListUsersResult).
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListUsersResult {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
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
  // Separate counter from listingQuota — a project is a much bigger
  // undertaking than a single listing, priced/limited independently.
  projectQuota: number;
  price: number;
  // Featured-listing allotment — granted to agent_credits on tier
  // (re-)selection/renewal, spent via POST /listings/:id/boost.
  hotCreditsPerPeriod: number;
  superHotCreditsPerPeriod: number;
  refreshCreditsPerPeriod: number;
  storyCreditsPerPeriod: number;
  // Set once a matching Stripe Product/Price exists — required before this
  // tier can be checked out if price > 0.
  stripePriceId: string | null;
  // Days a listing stays 'verified' before auto-expiring — null means
  // unlimited. Applied on approval (record_verification_action RPC) and on
  // POST /listings/:id/renew.
  listingDurationDays: number | null;
  // Annual counterpart to price/stripePriceId — null means this tier is
  // monthly-only (no Annual option shown on the Plan page for it).
  // annualPrice must match the real amount configured on
  // stripeAnnualPriceId's Stripe Price object; any discount vs. monthly
  // shown to agents is always derived from these two real numbers (see
  // getAnnualDiscountPercent below), never stored separately.
  annualPrice: number | null;
  stripeAnnualPriceId: string | null;
}

export interface CreateSubscriptionTierInput {
  name: string;
  listingQuota: number;
  projectQuota: number;
  price?: number;
  hotCreditsPerPeriod?: number;
  superHotCreditsPerPeriod?: number;
  refreshCreditsPerPeriod?: number;
  storyCreditsPerPeriod?: number;
  stripePriceId?: string;
  listingDurationDays?: number | null;
  annualPrice?: number | null;
  stripeAnnualPriceId?: string;
}

export interface UpdateSubscriptionTierInput {
  name?: string;
  listingQuota?: number;
  projectQuota?: number;
  price?: number;
  hotCreditsPerPeriod?: number;
  superHotCreditsPerPeriod?: number;
  refreshCreditsPerPeriod?: number;
  storyCreditsPerPeriod?: number;
  stripePriceId?: string;
  listingDurationDays?: number | null;
  annualPrice?: number | null;
  stripeAnnualPriceId?: string;
}

export type BillingInterval = 'month' | 'year';

export interface Subscription {
  agentId: string;
  tierId: string;
  status: string;
  currentPeriodEnd: string | null;
  // True once POST /subscriptions/me/cancel has gone through — the
  // subscription stays active/usable until currentPeriodEnd, then lapses.
  cancelAtPeriodEnd: boolean;
  // Which of the tier's two real prices this agent is actually paying —
  // set server-side (checkout webhook derives it from Stripe's own Price
  // object; the free-tier/admin-override select() path defaults to
  // 'month'). Drives the Plan page's "Current Plan · Annual" display.
  billingInterval: BillingInterval;
  tier: SubscriptionTier;
}

export interface AssignSubscriptionInput {
  tierId: string;
  currentPeriodEnd?: string;
  billingInterval?: BillingInterval;
}

// --- Standalone (à la carte) credit top-up purchases ---
// A one-off Stripe purchase (mode: 'payment') that increments agent_credits
// on top of whatever the current plan period already granted — distinct
// from a subscription_tiers period allotment, not a replacement for it.
// 'listing_quota' is deliberately excluded: a top-up buys more of a
// spendable action, not more listing slots (upgrading a plan does that).
export type PurchasableCreditType = 'hot' | 'super_hot' | 'refresh' | 'story';

export interface CreditPack {
  id: string;
  name: string;
  creditType: PurchasableCreditType;
  quantity: number;
  price: number;
  // Set once a matching one-time Stripe Price exists — required before this
  // pack can be checked out (same convention as SubscriptionTier.stripePriceId).
  stripePriceId: string | null;
  active: boolean;
}

export interface CreateCreditPackInput {
  name: string;
  creditType: PurchasableCreditType;
  quantity: number;
  price?: number;
  stripePriceId?: string;
  active?: boolean;
}

export interface UpdateCreditPackInput {
  name?: string;
  creditType?: PurchasableCreditType;
  quantity?: number;
  price?: number;
  stripePriceId?: string;
  active?: boolean;
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
  agentsByVerificationStatus: Record<string, number>;
  listingsByStatus: Record<string, number>;
  leadsByStatus: Record<string, number>;
  activeSubscriptionsByTier: Record<string, number>;
}

// GET /admin/revenue — real payments-ledger figures (see
// supabase/migrations/0065_payments_ledger.sql), tracked only from when
// that migration shipped. subscriptionRevenue/creditRevenue are kept as
// two separate totals (a product decision, not combined into one number)
// since they answer different questions: recurring plan revenue vs.
// one-off credit top-ups. ledgerStartsAt is null on a platform with zero
// payments recorded yet — render that as "tracking starts once your first
// payment lands", never a bare "PKR 0" implying a false all-time total.
export interface RevenueTierBreakdown {
  tierId: string;
  tierName: string;
  activeSubscribers: number;
  revenue: number;
}

export interface RevenueStats {
  subscriptionRevenue: number;
  creditRevenue: number;
  currency: string;
  ledgerStartsAt: string | null;
  // Per-tier revenue + current active-subscriber count.
  tierBreakdown: RevenueTierBreakdown[];
  // Same rows as tierBreakdown, sorted by activeSubscribers descending —
  // "top" plan is the one with the most people on it right now.
  topTiers: RevenueTierBreakdown[];
}

// One row per agent joining profile + agency + listing counts + subscription
// tier — the "see all agents' insights at a glance" capability.
export interface AgentOverview {
  id: string;
  displayName: string | null;
  // Always present (every signup path uses email/password or an OAuth
  // email) — the real fallback source when displayName is null, see
  // resolveDisplayName in utils/displayName.ts. Never fall back to `id`
  // (a raw UUID) anywhere this type is rendered.
  email: string | null;
  phone: string | null;
  city: string | null;
  verificationStatus: string;
  agency: { id: string; name: string; slug: string } | null;
  // True for the agent who registered/owns the agency (or was promoted via
  // setStaffAdmin); false for every other agent added through that admin's
  // "Agency Staff" screen. A staff row still needs no individual identity
  // verification of its own — it's covered by the agency's own review, same
  // as it's exempt from the document-completeness gate (see
  // agents.repository.ts::setVerificationStatus) — so the Agents admin page
  // splits staff rows into their own tab instead of the Verify/Reject queue.
  isAgencyAdmin: boolean;
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

// Super Admin-curated placement for the public Agents directory (apps/web
// /agents) — 'titanium' and 'featured' sections sit above the plain
// directory. Deliberately assigned (PATCH /agencies/:id/tier), not computed
// from listing counts, so an agency can't game its way up by just posting
// more listings. See supabase/migrations/0039_agency_tier.sql.
export type AgencyTier = 'titanium' | 'featured' | 'basic';

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
  // Set when verificationStatus is 'rejected' — null otherwise (cleared on
  // any later approval, see AgenciesRepository.setVerificationStatus).
  rejectionReason: string | null;
  salesAssociateCount: number;
  tier: AgencyTier;
  // Percent (0-100), nullable — falls back to DealsRepository's
  // PLATFORM_DEFAULT_COMMISSION_RATE when unset. See
  // supabase/migrations/0064_deals_and_commission.sql.
  defaultCommissionRate?: number | null;
}

// Public Agents directory search — mirrors ProjectSearchFilters in shape.
// propertyTypeSlug filters on the agency's *inventory* (any verified listing
// of that type), not a column on the agency itself.
export interface AgencySearchFilters {
  city?: string;
  location?: string; // free-text match against the agency's street address, distinct from city
  tier?: AgencyTier;
  propertyTypeSlug?: string;
  search?: string; // company/agency name
  page?: number;
  pageSize?: number;
}

// "X for Sale | Y for Rent" computed server-side per agency — never stored,
// same single-source-of-truth principle as AgencyStats below.
export interface AgencyWithStats extends Agency {
  forSaleCount: number;
  forRentCount: number;
}

// Mirrors services/api/src/agencies/agencies.repository.ts::PaginatedAgencies.
export interface PaginatedAgencies {
  items: AgencyWithStats[];
  total: number;
  page: number;
  pageSize: number;
}

// Backs "Browse Agencies By City" (Karachi 1464, Lahore 1520, ...).
export interface AgencyCityCount {
  city: string;
  count: number;
}

export interface SetAgencyTierInput {
  tier: AgencyTier;
}

// Staff row embedded in GET /agencies/:slug (AgenciesRepository.findBySlug)
// — a trimmed-down AgentProfileSummary, public-safe (no email — agent_profiles
// has none of its own, it lives on auth.users). Backs the Agency detail
// page's "Agency Staff" cards (apps/web /agents/[slug]).
export interface AgencyStaffPreview {
  id: string;
  displayName: string | null;
  title: string | null;
  photoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
}

// Full Agency detail page fetch — Agency's flat fields plus the embedded
// staff roster. AgencyStats (forSaleCount/forRentCount/byPropertyType) is
// fetched separately via GET /agencies/:slug/stats, same split as the plain
// Agency + getStats() already had.
export interface AgencyDetail extends Agency {
  staff: AgencyStaffPreview[];
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
  // Percent (0-100) — see Agency.defaultCommissionRate.
  defaultCommissionRate?: number;
}

export interface SetAgencyVerificationStatusInput {
  status: 'verified' | 'rejected';
  // Only meaningful when status: 'rejected' — cleared server-side on any
  // 'verified' write regardless of what's passed here.
  reason?: string;
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
  // Set when verificationStatus is 'rejected' — null otherwise.
  rejectionReason: string | null;
  isAgencyAdmin: boolean;
  photoUrl: string | null;
}

export interface CreateAgencyStaffInput {
  email: string;
  password: string;
  displayName?: string;
  // Set via agentsRepository.uploadStandaloneAvatar() before this input is
  // submitted — there's no agent id yet to upload directly against.
  photoUrl?: string;
}

// Self-service agency registration (signup's "Agency" account type) —
// mirrors services/api/src/agencies/dto/register-agency.dto.ts exactly.
export interface RegisterAgencyInput {
  agencyName: string;
  agencySlug: string;
  agencyPhone?: string;
  agencyEmail?: string;
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
  // propertyTypeSlug backs the Agency detail page's clickable stat tiles —
  // deep-links into GET /listings?agencySlug=&propertyTypeSlug=.
  byPropertyType: { propertyTypeSlug: string; label: string; forSale: number; forRent: number }[];
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
  // Set when verificationStatus is 'rejected' — null otherwise (cleared on
  // any later approval, see AgentsRepository.setVerificationStatus).
  rejectionReason: string | null;
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

// Same {views,clicks,leads,calls,whatsapp,sms,emails} shape as
// AgentAnalytics, listing-scoped instead of agent-scoped — GET
// /listings/:id/analytics (per-listing performance breakdown).
export type ListingAnalytics = AgentAnalytics;

// Same {date,views,leads} shape as AgentDailyAnalyticsPoint, listing-scoped
// — GET /listings/:id/analytics/daily.
export type ListingDailyAnalyticsPoint = AgentDailyAnalyticsPoint;

// GET /agents/:id/listings/analytics — one ListingAnalytics row per listing
// the agent can see (scope-filtered own/agency), for batch-merging into a
// My Listings table without a per-row analytics fetch.
export interface ListingBatchAnalyticsItem extends ListingAnalytics {
  listingId: string;
}

// --- Deals & Revenue --------------------------------------------------------
// Mirrors services/api/src/deals/deals.repository.ts's DEAL_LIST_COLUMNS
// mapping and markSold/markRented's returned `deal` shape. The revenue
// ledger row written by "Mark Sold"/"Mark Rented" — see
// supabase/migrations/0064_deals_and_commission.sql's `deals` table.
export type DealType = 'sale' | 'rent';

// listingTitle/agentName are only populated by DealsRepository.list's join
// (listings/agent_profiles embed) — markSold/markRented's returned deal
// omits both, so they're optional here rather than on a separate type.
export interface Deal {
  id: string;
  listingId: string;
  listingTitle?: string | null;
  agentId: string;
  agentName?: string | null;
  agencyId?: string | null;
  dealType: DealType;
  amount: number; // sale price, or monthly rent for a rent deal
  commissionRate?: number | null; // percent
  commissionAmount: number;
  closedAt: string;
  notes?: string | null;
  createdAt: string;
}

// GET /agents/:id/revenue — mirrors DealsRepository.getRevenue's returned
// shape exactly (period bucket key format depends on the requested
// RevenuePeriod: 'YYYY-MM' | 'YYYY-Qn' | 'YYYY').
export interface RevenuePeriodPoint {
  period: string;
  revenue: number;
  dealCount: number;
}

// Only present when scope: 'agency' was requested AND the target agent is
// actually an agency admin — see DealsRepository.getRevenue.
export interface AgentRevenueBreakdown {
  agentId: string;
  displayName: string | null;
  revenue: number;
  dealCount: number;
}

export interface RevenueSummary {
  totalRevenue: number;
  dealCount: number;
  byPeriod: RevenuePeriodPoint[];
  byAgent?: AgentRevenueBreakdown[];
}

export type ListingEngagementType = 'view' | 'click' | 'call' | 'whatsapp' | 'sms' | 'email';

// Confirmed real on the Profolio "Quota and Credits" card: separate
// Available/Used/Total pools per action type, not a single quota number.
export type AgentCreditType = 'listing_quota' | 'refresh' | 'hot' | 'super_hot' | 'story';

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

// listing/project are the joined summaries FavoritesRepository.list() actually
// selects — exactly one of listingId/projectId (and listing/project) is set
// per row, mirroring the favorites_target_check constraint added in
// 0060_project_favorites.sql. Both are nullable since a favorited row could
// theoretically be deleted out from under the favorite.
export interface Favorite {
  id: string;
  listingId: string | null;
  projectId: string | null;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    price: number;
    city: string;
    area: string;
    status: ListingStatus;
  } | null;
  project: {
    id: string;
    name: string;
    slug: string;
    city: string;
    area: string;
    status: ProjectStatus;
    coverImageUrl: string | null;
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
  posterType?: ListingPosterType;
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
  email: string | null;
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
  email?: string;
}

export interface UpdateDeveloperInput {
  name?: string;
  logoUrl?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  city?: string;
  email?: string;
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
  // Same shared-pool boost system as Listing (boostTier/boostExpiresAt/
  // refreshedAt/storyExpiresAt below) — PlanLifecycleService's cron
  // reverts boostTier to 'basic'/clears storyExpiresAt once their window
  // passes, same "credits per period, not forever" model.
  boostTier: ListingBoostTier;
  boostExpiresAt: string | null;
  refreshedAt: string | null;
  storyExpiresAt: string | null;
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
  area?: string;
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

// An agent may delete their own project at any verification status — same
// freedom they already have with listings (no equivalent "once verified"
// restriction exists for canDeleteListing, because no such predicate even
// exists; listings.controller.ts's remove() never checks status either).
export function canDeleteProject(project: Project, role: Role | undefined, userId: string | undefined): boolean {
  if (role === 'super_admin') return true;
  return role === 'agent' && !!userId && project.createdBy === userId;
}

// --- Notifications (mirrors 0009_notifications.sql) ----------------------------

export type NotificationType =
  | 'price_drop'
  | 'new_match'
  | 'inquiry_reply'
  | 'verification_status'
  | 'lead_assigned'
  | 'reminder'
  | 'support_ticket';

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

// --- Support tickets (mirrors 0043_support_tickets.sql) ------------------------
// Agent-facing help desk (apps/web /help) — status-only lifecycle, no reply
// thread. See services/api/src/support/support.repository.ts.

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved';

export interface SupportTicket {
  id: string;
  createdBy: string;
  agencyId: string | null;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  adminNote: string | null;
  // The verification_staff member this ticket has been handed off to —
  // null means still unassigned (the default for every ticket). Set only
  // by Super Admin (PATCH /support/tickets/:id/assign).
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupportTicketInput {
  subject: string;
  message: string;
}

// Agent editing their own still-open ticket — server rejects once status
// has moved past 'open' (see support.repository.ts::assertOwnOpenTicket).
export interface UpdateSupportTicketInput {
  subject?: string;
  message?: string;
}

export interface UpdateSupportTicketStatusInput {
  status: SupportTicketStatus;
  adminNote?: string;
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
  // Set when status is 'rejected' — null otherwise.
  rejectionReason: string | null;
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

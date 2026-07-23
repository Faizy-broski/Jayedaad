-- Jayedaad core schema. 1:1 translation of the architecture in
-- Jayedaad_Architectural_Blueprint.md §3.2 to raw SQL, managed via the
-- Supabase CLI instead of Prisma. Identity lives in Supabase's built-in
-- auth.users — every FK that would have pointed at a "users" table points
-- at auth.users(id) instead. App-specific role/agent linkage is added in
-- 0002_profiles_and_trigger.sql.

create extension if not exists "pgcrypto";

create type public.app_role as enum ('super_admin', 'verification_staff', 'agent', 'buyer', 'owner');
create type public.agent_verification_status as enum ('pending', 'verified', 'rejected');
-- Not a fixed enum: Super Admin creates/edits subscription plans at runtime
-- (real Zameen tier names — Starter/Business/Titanium/Titanium Plus — never
-- matched the earlier placeholder Lite/Go/Pro/Ultimate enum anyway, and the
-- client's own docs flagged naming as "pending final feature matrix").
-- subscription_tiers.name is plain text (see Taxonomy section below).
-- Verified against the real Profolio "My Listings" status tabs (Active/
-- Pending/Rejected/Expired/Deleted/Downgraded/Inactive). Active/Pending/
-- Rejected map onto the existing verified/pending_verification/rejected
-- trio; expired/deleted/inactive are unambiguous lifecycle states.
-- 'downgraded' is real but its exact semantics couldn't be confirmed from a
-- UI screenshot alone — modeled here as "was live, demoted back out of
-- public visibility by a post-publication quality/compliance flag" (distinct
-- from `rejected`, which is a pre-publication decision), the most plausible
-- reading, not a confirmed fact. record_verification_action() in
-- 0003_rpc_functions.sql is untouched — it only ever produces
-- pending_verification/verified/rejected; these four new states are set by
-- other mechanisms (expiry job, owner/staff deactivation, moderation flag)
-- not built yet.
create type public.listing_status as enum (
  'pending_verification',
  'verified',
  'rejected',
  'expired',
  'deleted',
  'downgraded',
  'inactive'
);
create type public.verification_action as enum ('approve', 'reject', 'request_info');
create type public.lead_status as enum ('new', 'contacted', 'negotiating', 'closed', 'lost');
create type public.lead_source as enum ('chatbot', 'contact_form', 'call_request');
-- Verified against a real Zameen.com "Contact Agent" form's "I am a:"
-- dropdown — who the inquirer is, distinct from lead_source (how they reached us).
create type public.lead_inquirer_type as enum ('buyer_tenant', 'agent', 'other');
create type public.lead_activity_type as enum ('note', 'status_change', 'call', 'assignment', 'email', 'whatsapp');
create type public.reminder_channel as enum ('in_app', 'push', 'email');
create type public.platform_type as enum ('web', 'mobile', 'agent_portal', 'admin');

-- Listing taxonomy/measurement enums — Zameen-first (Marla/Kanal lead the
-- area_unit list; property type categories, in their own table below, match
-- Zameen's own residential/commercial/plot grouping), with Zillow's living-area-vs-lot-size discipline
-- folded in via separate area_value/area_unit + year_built columns below.
create type public.listing_purpose as enum ('sale', 'rent');
create type public.area_unit as enum ('marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre');
create type public.furnishing_status as enum ('unfurnished', 'semi_furnished', 'furnished');
-- Not a fixed enum: Super Admin can add/rename/retire top-level property
-- categories at runtime (see property_type_categories table below), not
-- just the individual types within Homes/Plots/Commercial.
-- Verified against a real scraped Zameen.com listing detail page (see
-- 0005_taxonomy_seed.sql) — 7 categories, not a guessed set.
create type public.amenity_category as enum (
  'main_features',
  'rooms',
  'business_communication',
  'community_features',
  'healthcare_recreation',
  'nearby_locations',
  'other_facilities'
);
-- Listing-level promotional ranking (Zameen's Basic/Premium/Hot/Super Hot
-- "Value Booster" products) — independent of the owning agency's
-- subscription tier. Controls search result ordering.
create type public.listing_boost_tier as enum ('basic', 'premium', 'hot', 'super_hot');

-- --- Agents & Subscriptions -------------------------------------------------

create table public.agent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  verification_status public.agent_verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.subscription_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- free text, Super Admin-managed — see note above
  listing_quota int not null,
  price numeric(12, 2) not null default 0,
  analytics_depth jsonb not null
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null unique references public.agent_profiles (id) on delete cascade,
  tier_id uuid not null references public.subscription_tiers (id),
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- --- Taxonomy (Super Admin-managed, per [Reqs §9]) ------------------------------
-- Not hardcoded enums: property types, their top-level categories, and
-- amenities must all be manageable at runtime via the API, not fixed at
-- migration time.

create table public.property_type_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  sort_order int not null default 0
);

create table public.property_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  category_id uuid not null references public.property_type_categories (id),
  sort_order int not null default 0
);
create index property_types_category_idx on public.property_types (category_id);

-- value_unit: null means a pure boolean tag (present/absent), same as
-- before. When set (e.g. "spaces", "kms"), Super Admin is marking this
-- amenity as one that carries a number on a listing (confirmed real on a
-- scraped Zameen detail page: "Parking Spaces: 2", "Distance From Airport
-- (kms)") — see listing_amenities.value below.
create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  category public.amenity_category not null,
  value_unit text,
  sort_order int not null default 0
);

-- Which property-type categories (Homes/Plots/Commercial) an amenity is
-- even relevant for — confirmed a real gap: without this, a Plot listing
-- could "select" Drawing Room/Servant Quarters. Many-to-many: an amenity
-- like Electricity Backup or Security Staff can reasonably apply to more
-- than one category. Orthogonal to `amenity_category` above, which is the
-- display SECTION an amenity appears under (Main Features/Rooms/...), not
-- which property types can select it.
create table public.amenity_property_type_categories (
  amenity_id uuid not null references public.amenities (id) on delete cascade,
  property_type_category_id uuid not null references public.property_type_categories (id) on delete cascade,
  primary key (amenity_id, property_type_category_id)
);
create index amenity_property_type_categories_category_idx on public.amenity_property_type_categories (property_type_category_id);

-- --- Listings ----------------------------------------------------------------

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id),
  agent_id uuid references public.agent_profiles (id),
  title text not null,
  description text,
  price numeric(14, 2) not null,
  purpose public.listing_purpose not null default 'sale',
  city text not null,
  area text not null, -- broad locality (e.g. "Bahria Town")
  society text, -- finer-grained: housing society/phase/sector/block
  sub_area text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  property_type_id uuid not null references public.property_types (id),
  bedrooms int,
  bathrooms int,
  kitchens int, -- real field on Zameen detail pages ("3 Kitchens"), not just a boolean amenity
  floors int, -- total floor count of the house — distinct from floor_level (a unit's position within a building)
  area_value numeric(12, 2) not null,
  area_unit public.area_unit not null default 'marla',
  year_built int,
  floor_level text,
  furnishing_status public.furnishing_status,
  boost_tier public.listing_boost_tier not null default 'basic',
  -- Confirmed real on the live Profolio "Post Listing" form (screenshot,
  -- not inferred): two toggles under Price and Area.
  installment_available boolean not null default false,
  ready_for_possession boolean not null default false,
  status public.listing_status not null default 'pending_verification',
  internal_notes text, -- staff-only; never selected by the public listings query
  created_at timestamptz not null default now()
);
create index listings_status_city_area_idx on public.listings (status, city, area);
create index listings_property_type_idx on public.listings (property_type_id);
create index listings_purpose_idx on public.listings (purpose);
create index listings_boost_tier_idx on public.listings (boost_tier, created_at desc);

-- Confirmed real on the live Profolio form: a listing carries its own
-- contact numbers (a repeatable "+"-add Mobile field, plus a separate
-- Landline field) — not just the owner/agent's account phone.
create type public.contact_number_type as enum ('mobile', 'landline');

create table public.listing_contact_numbers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  type public.contact_number_type not null,
  country_code text not null default '+92',
  number text not null
);
create index listing_contact_numbers_listing_idx on public.listing_contact_numbers (listing_id);

-- value: the actual figure for a valued amenity on this listing (e.g. 2 for
-- Parking Spaces) — null for a plain boolean-tag amenity (amenities.value_unit
-- is null) or when the submitter didn't provide one for a valued amenity.
create table public.listing_amenities (
  listing_id uuid not null references public.listings (id) on delete cascade,
  amenity_id uuid not null references public.amenities (id),
  value numeric,
  primary key (listing_id, amenity_id)
);

create table public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  url text not null,
  type text not null,
  compressed_url text,
  is_cover boolean not null default false,
  sort_order int not null default 0
);

-- Zillow-style price history: appended automatically by trigger, never by
-- application code, so a price change can never be logged inconsistently.
-- Feeds the chatbot's "rank listings I should reduce the price on" capability
-- [Reqs §3.1], which needs historical price movement to reason about.
create table public.listing_price_history (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  price numeric(14, 2) not null,
  recorded_at timestamptz not null default now()
);
create index listing_price_history_listing_idx on public.listing_price_history (listing_id, recorded_at);

create or replace function public.record_listing_price_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.price is distinct from old.price then
    insert into public.listing_price_history (listing_id, price)
    values (new.id, new.price);
  end if;
  return new;
end;
$$;

create trigger on_listing_price_change
  after insert or update of price on public.listings
  for each row execute function public.record_listing_price_history();

-- --- Verification audit (insert-only) -----------------------------------------

create table public.verification_audit_log (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id),
  reviewer_id uuid not null references auth.users (id),
  action public.verification_action not null,
  note text,
  created_at timestamptz not null default now()
);

-- --- CRM / Leads ---------------------------------------------------------------

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id),
  -- Nullable: a lead starts unassigned (e.g. a public contact-form submission
  -- against a listing with no agent) until J.Team assigns it — see
  -- assign_lead() in 0003_rpc_functions.sql and lead_assignments below,
  -- which records the assignment history this column denormalizes the "current" value of.
  agent_id uuid references public.agent_profiles (id),
  name text not null,
  phone text not null,
  email text not null,
  -- Real Zameen "Contact Agent" form fields, confirmed via live scrape: a
  -- required inquiry message, an optional "I am a:" dropdown, and a
  -- "keep me informed about similar properties" opt-in checkbox.
  message text not null,
  inquirer_type public.lead_inquirer_type,
  wants_similar_alerts boolean not null default false,
  status public.lead_status not null default 'new',
  source public.lead_source not null,
  created_at timestamptz not null default now()
);
create index leads_agent_status_created_idx on public.leads (agent_id, status, created_at);

create table public.lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  from_status public.lead_status not null,
  to_status public.lead_status not null,
  changed_by uuid not null references auth.users (id),
  changed_at timestamptz not null default now()
);

-- Append-only: no UPDATE/DELETE grants for the API role (see below).
create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  body text not null,
  created_at timestamptz not null default now()
);

-- Append-only unified timeline feed.
create table public.lead_activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  type public.lead_activity_type not null,
  ref_id text,
  created_at timestamptz not null default now()
);

create table public.lead_assignments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  agent_id uuid not null references public.agent_profiles (id),
  assigned_by uuid not null references auth.users (id),
  assigned_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete cascade,
  owner_id uuid not null references auth.users (id),
  title text not null,
  due_at timestamptz,
  completed_at timestamptz
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  remind_at timestamptz not null,
  channel public.reminder_channel not null,
  fired_at timestamptz
);

-- --- Analytics (single source of truth) -----------------------------------------

-- Verified against the real Profolio agent dashboard's "Analytics" card:
-- Views/Clicks/Calls/WhatsApp/SMS/Emails are all tracked as distinct
-- engagement events (Leads is a separate metric, backed by the `leads`
-- table itself) — originally just a view-only table, renamed and extended
-- rather than left half-built.
create type public.listing_engagement_type as enum ('view', 'click', 'call', 'whatsapp', 'sms', 'email');

create table public.listing_engagement_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  type public.listing_engagement_type not null default 'view',
  viewer_session_id text not null,
  platform public.platform_type not null,
  created_at timestamptz not null default now()
);
create index listing_engagement_events_listing_idx on public.listing_engagement_events (listing_id);
create index listing_engagement_events_type_idx on public.listing_engagement_events (listing_id, type, created_at);

-- Verified against the real Profolio "Quota and Credits" card: agents draw
-- from separate credit pools for listing quota, refreshing a stale listing,
-- and promoting one to Hot/Super Hot — not a single number.
create type public.agent_credit_type as enum ('listing_quota', 'refresh', 'hot', 'super_hot');

create table public.agent_credits (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles (id) on delete cascade,
  credit_type public.agent_credit_type not null,
  total int not null default 0,
  used int not null default 0,
  unique (agent_id, credit_type)
);
create index agent_credits_agent_idx on public.agent_credits (agent_id);

create table public.search_queries (
  id uuid primary key default gen_random_uuid(),
  query_text text not null,
  user_id uuid references auth.users (id),
  structured_filters jsonb,
  created_at timestamptz not null default now()
);

-- Append-only enforcement at the DB level: revoke UPDATE/DELETE from anyone
-- but the (service-role-only) NestJS API, and the API itself never issues
-- UPDATE/DELETE against these tables — matches [Spec §4]'s "append-only" guarantee.
revoke update, delete on public.lead_notes, public.lead_activity, public.lead_status_history, public.verification_audit_log from anon, authenticated;

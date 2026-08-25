-- Deals & Revenue: lets an agent/agency admin mark a listing Sold or
-- Rented and records the commission earned as a first-class ledger row
-- (`deals`), kept separate from the `listings` table itself — mirrors
-- Zoho CRM's Deal-record-separate-from-Property-record model and gives
-- revenue reports (by agent/agency, bucketed by month/quarter/year) a
-- clean, append-only source to sum instead of parsing listing state.
-- "Profit" here means commission revenue only — no expense/cost tracking
-- exists or is being added (see services/api/src/deals/).

-- New terminal listing_status values: a listing that's actually sold or
-- rented is a distinct end-state from every existing status (verified/
-- expired/deleted/...). Postgres can't use a value added via ALTER TYPE ...
-- ADD VALUE in the same transaction it was added in, so — same discipline
-- as 0027_project_status_draft.sql — these run first and nothing below
-- references 'sold'/'rented' directly.
alter type public.listing_status add value 'sold';
alter type public.listing_status add value 'rented';

create type public.deal_type as enum ('sale', 'rent');

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id),
  agent_id uuid not null references public.agent_profiles (id),
  agency_id uuid references public.agencies (id), -- denormalized from agent_profiles.agency_id at insert time, for fast agency-wide revenue queries without a join
  deal_type public.deal_type not null,
  amount numeric not null, -- sale price, or monthly rent amount for a rent deal
  commission_rate numeric, -- percent, nullable if a flat fee was used instead
  commission_amount numeric not null, -- the actual revenue figure every report sums
  closed_at date not null, -- period-bucketing key (month/quarter/year reports group on this)
  notes text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);
create index deals_agent_closed_idx on public.deals (agent_id, closed_at);
create index deals_agency_closed_idx on public.deals (agency_id, closed_at);

-- Defense-in-depth only, same posture 0039_rls_hardening.sql gave the other
-- financial tables (agent_credits/subscriptions/subscription_tiers): the
-- NestJS API always uses the service-role key and bypasses RLS entirely, so
-- this is enabled with zero policies rather than left off, matching every
-- other sensitive table's "enabled, zero policies, service-role only"
-- convention (see that migration's header comment for the full table list).
alter table public.deals enable row level security;

-- Agency-level default commission %, applied by services/api's mark-sold/
-- mark-rented endpoints when the caller doesn't override it per-deal.
-- Nullable: falls back to a platform-wide default constant when unset.
alter table public.agencies add column default_commission_rate numeric;

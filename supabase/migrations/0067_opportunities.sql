-- Phase 1 of the CRM maturity build-out: a real pre-close pipeline object
-- sitting between `leads` (raw inquiry, untouched by this migration) and
-- `deals` (closed-won revenue ledger, 0064_deals_and_commission.sql,
-- untouched except for one new FK below) — the standard Lead -> Opportunity
-- -> Deal shape, matching 0064's own header comment about mirroring Zoho
-- CRM's deal model. See services/api/src/opportunities/ for the write path.

-- New lead_activity_type value for the "this lead was promoted to an
-- opportunity" system-generated timeline entry (see convert_lead_to_
-- opportunity() in 0068_opportunity_rpc_functions.sql). Added here, in its
-- own statement ahead of everything else in this file, so it's committed
-- before that later migration's function body ever runs an insert
-- referencing it — same discipline 0064_deals_and_commission.sql's header
-- comment documents for 'sold'/'rented'.
alter type public.lead_activity_type add value 'opportunity_converted';

create type public.opportunity_stage as enum (
  'qualification', 'needs_analysis', 'proposal', 'negotiation', 'won', 'lost'
);

-- Stage -> default probability-of-close weighting. Seeded onto a new
-- opportunity (and re-seeded on every stage change) but editable per-
-- opportunity thereafter — same "denormalized, overridable" shape as
-- deals.commission_rate falling back to agencies.default_commission_rate.
-- Phase 4's forecast calc (sum(value * probability / 100)) reads whatever
-- value actually sits on the opportunity, hand-edited or not.
create table public.opportunity_stage_config (
  stage public.opportunity_stage primary key,
  default_probability numeric not null check (default_probability between 0 and 100),
  display_order int not null unique
);
insert into public.opportunity_stage_config (stage, default_probability, display_order) values
  ('qualification', 20, 1),
  ('needs_analysis', 40, 2),
  ('proposal', 60, 3),
  ('negotiation', 80, 4),
  ('won', 100, 5),
  ('lost', 0, 6);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: an opportunity can be promoted from a lead ("Convert to
  -- Opportunity") OR created directly with no source lead (a walk-in/
  -- referral) — both are real product-approved paths, not one canonical +
  -- one exception.
  lead_id uuid references public.leads (id),
  listing_id uuid references public.listings (id),
  project_id uuid references public.projects (id),
  agent_id uuid not null references public.agent_profiles (id),
  agency_id uuid references public.agencies (id),
  -- Reuses deals.deal_type's enum (0064_deals_and_commission.sql) — needed
  -- up front, not just at close, since deals.deal_type is NOT NULL and an
  -- opportunity closing 'won' inserts a deals row directly (see
  -- OpportunitiesRepository.updateStage()). Defaults 'sale', the more
  -- common case; settable at creation.
  deal_type public.deal_type not null default 'sale',
  -- Always present (not derived from listing/project title at read time) so
  -- a kanban card always has something to show, even for an opportunity
  -- with neither a listing nor a project attached.
  name text not null,
  value numeric not null,
  stage public.opportunity_stage not null default 'qualification',
  probability numeric not null,
  expected_close_date date not null,
  -- Required (app-enforced, not a DB constraint — see
  -- OpportunitiesController's stage-transition validation) once stage
  -- moves to 'lost'.
  lost_reason text,
  -- Set once this opportunity is won and a deals row is created for it —
  -- see services/api/src/opportunities/opportunities.repository.ts's
  -- updateStage(), which creates the deals row in Nest (reusing
  -- DealsRepository's existing commission-resolution logic) before calling
  -- the stage-transition RPC below.
  deal_id uuid references public.deals (id),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Relaxed vs. leads' XOR constraint: an opportunity may reference neither
  -- a listing nor a project (an off-market deal-in-progress), but never both.
  constraint opportunities_listing_or_project_chk check (
    (listing_id is not null and project_id is null)
    or (listing_id is null and project_id is not null)
    or (listing_id is null and project_id is null)
  )
);

-- One ACTIVE opportunity per lead, not a lifetime cap — if a lead's prior
-- opportunity was lost, the same lead can be converted again for a fresh
-- attempt. The partial index (excluding 'lost' rows) is what makes that
-- legal while still preventing two simultaneously-open opportunities on
-- the same lead.
create unique index opportunities_active_lead_id_uidx on public.opportunities (lead_id)
  where lead_id is not null and stage <> 'lost';
create index opportunities_agent_stage_idx on public.opportunities (agent_id, stage);
create index opportunities_agency_stage_idx on public.opportunities (agency_id, stage);

create table public.opportunity_stage_history (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id),
  from_stage public.opportunity_stage,
  to_stage public.opportunity_stage not null,
  changed_by uuid not null references auth.users (id),
  changed_at timestamptz not null default now()
);
create index opportunity_stage_history_opportunity_idx on public.opportunity_stage_history (opportunity_id, changed_at);

-- Forward link from the closed-won ledger back to the opportunity that
-- produced it — nullable since pre-existing deals (and any future
-- mark-sold/mark-rented call that doesn't go through an opportunity) have
-- none. Nothing else about `deals` changes.
alter table public.deals add column opportunity_id uuid references public.opportunities (id);

alter table public.opportunities enable row level security;
alter table public.opportunity_stage_history enable row level security;
alter table public.opportunity_stage_config enable row level security;
-- Defense-in-depth only, zero client-facing policies — same posture as
-- `deals`/`agent_credits`/`subscriptions` (0039_rls_hardening.sql, 0064):
-- the API's service-role key is the real enforcement point and bypasses
-- RLS entirely.

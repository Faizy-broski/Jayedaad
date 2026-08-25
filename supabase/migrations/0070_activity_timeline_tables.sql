-- Continuation of 0069_activity_timeline.sql, split into its own migration
-- so the CHECK constraint below (which references 'meeting', added in that
-- prior migration) runs in a later, separately-committed transaction — see
-- 0069's header comment for why the combined version 55P04'd.

create table public.activity_log_entries (
  id uuid primary key default gen_random_uuid(),
  -- At least one of these two is required (see the check constraint below)
  -- — a call/email/whatsapp/meeting can be logged against a lead, an
  -- opportunity, or both at once (e.g. a call about an opportunity that
  -- also touches its source lead).
  lead_id uuid references public.leads (id),
  opportunity_id uuid references public.opportunities (id),
  type public.lead_activity_type not null check (type in ('call', 'email', 'whatsapp', 'meeting')),
  logged_by uuid not null references auth.users (id),
  -- Editable, not just "now" — lets an agent log a call that happened
  -- yesterday, same "occurred_at, not just created_at" distinction a real
  -- CRM activity log needs.
  occurred_at timestamptz not null default now(),
  summary text not null,
  outcome text,
  created_at timestamptz not null default now(),
  constraint activity_log_entries_target_chk check (lead_id is not null or opportunity_id is not null)
);
create index activity_log_entries_lead_idx on public.activity_log_entries (lead_id, occurred_at) where lead_id is not null;
create index activity_log_entries_opportunity_idx on public.activity_log_entries (opportunity_id, occurred_at) where opportunity_id is not null;

-- Parallel to the existing lead_activity table (0001_init.sql) rather than
-- overloading it with a nullable second parent FK — zero schema-drift risk
-- to the already-shipped leads feature. Same "type + untyped ref_id"
-- pointer-only shape; ActivityRepository joins this against
-- activity_log_entries by ref_id to render the real content.
create table public.opportunity_activity (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id),
  type public.lead_activity_type not null,
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index opportunity_activity_opportunity_idx on public.opportunity_activity (opportunity_id, created_at);

alter table public.activity_log_entries enable row level security;
alter table public.opportunity_activity enable row level security;
-- Defense-in-depth only, zero client-facing policies — same posture as
-- every other CRM table (leads/opportunities/deals): the API's
-- service-role key is the real enforcement point.

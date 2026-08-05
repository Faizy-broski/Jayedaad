-- Phase 3 of the Document Verification spec: real appointment/calendar
-- backing for the Sales Associate "calendar" bullet AND individual owners
-- (every listing has an owner_id, only sometimes an agent_id — see
-- listings.owner_id/agent_id in 0001_init.sql). "Book a Visit" on a listing
-- (services/api/src/leads/leads.repository.ts) now also inserts a
-- 'requested' row here alongside the lead it already creates — scoped to
-- the listing's agent if one is assigned, otherwise to the owner directly —
-- so a calendar starts populated instead of empty; agents/owners can also
-- create appointments manually.
--
-- Written to be safely re-runnable (DO block + IF NOT EXISTS) in case an
-- earlier partial run already created some of these objects.

do $$ begin
  create type public.appointment_status as enum ('requested', 'confirmed', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agent_profiles (id) on delete cascade,
  owner_id uuid references auth.users (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  listing_id uuid references public.listings (id) on delete set null,
  title text not null,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 30,
  status public.appointment_status not null default 'requested',
  notes text,
  created_at timestamptz not null default now(),
  -- exactly one of agent_id/owner_id — same XOR shape as
  -- onboarding_documents.agency_id/agent_id (0012_documents.sql).
  constraint appointments_subject_xor check (
    (agent_id is not null and owner_id is null) or (agent_id is null and owner_id is not null)
  )
);
create index if not exists appointments_agent_idx on public.appointments (agent_id, scheduled_at);
create index if not exists appointments_owner_idx on public.appointments (owner_id, scheduled_at);

-- Same PII/private-business-data posture as listing_documents/leads: RLS
-- enabled, zero policies — service-role (NestJS) only.
alter table public.appointments enable row level security;

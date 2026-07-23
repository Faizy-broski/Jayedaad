-- Agencies & agent reviews, grounded in Zameen.com's own agency/agent model:
-- an Agency (company) has many Agents; an Agent may be independent (no
-- agency). Stats shown on Zameen's agency/agent pages (listings count,
-- views, inquiries) are deliberately NOT stored columns here — computed at
-- query time from listings/listing_engagement_events/leads, matching the single-source-
-- of-truth principle already established for view counts [Reqs §4.3].

create type public.agency_verification_status as enum ('pending', 'verified', 'rejected');

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  description text,
  phone text,
  email text,
  city text,
  address text, -- full street address, confirmed on a real Zameen agency profile page — distinct from city
  business_hours text, -- plain display string (e.g. "Monday to Sunday, 9AM-6PM") — real page shows no finer per-day granularity
  verification_status public.agency_verification_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- agent_profiles was created in 0001_init.sql, before agencies existed —
-- extended here rather than editing that file, since Postgres can't FK
-- forward to a table that doesn't exist yet at migration time.
alter table public.agent_profiles
  add column agency_id uuid references public.agencies (id),
  add column display_name text,
  add column bio text,
  add column phone text,
  add column photo_url text,
  add column title text; -- staff role, e.g. "CEO" — confirmed on the real agency staff list

create index agent_profiles_agency_idx on public.agent_profiles (agency_id);

-- One review per (reviewer, agent) — prevents review spam. NOTE: a real
-- scraped Zameen agency profile page explicitly has NO reviews/ratings
-- section (confirmed absent, not just unchecked) — this table is a
-- deliberate Jayedaad trust-differentiator [Spec §1], not a Zameen-sourced
-- pattern. Corrected here after the earlier schema pass mistakenly
-- attributed it to "both Zameen and Zillow."
create table public.agent_reviews (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id),
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  unique (agent_id, reviewer_id)
);
create index agent_reviews_agent_idx on public.agent_reviews (agent_id);

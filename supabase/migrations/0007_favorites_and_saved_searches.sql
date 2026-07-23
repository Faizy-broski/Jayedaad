-- Favorites: the missing piece of [Reqs §6]/[Spec §8]'s "Buyer dashboard:
-- saved/favorite listings" requirement — named in the spec since day one,
-- never actually given a table.
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);
create index favorites_user_idx on public.favorites (user_id);

-- Saved searches: distinct from search_queries (0001_init.sql), which just
-- logs one-off searches for analytics. A saved search is a named, persisted
-- filter set with an alert cadence — Zillow's Instant/Daily/off pattern.
create type public.alert_frequency as enum ('instant', 'daily', 'weekly', 'off');

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  -- Same filter shape GET /listings already accepts (city, propertyTypeSlug,
  -- purpose, bedrooms, minBathrooms, min/maxAreaValue, areaUnit) — kept as
  -- jsonb rather than duplicating those columns here.
  filters jsonb not null,
  alert_frequency public.alert_frequency not null default 'daily',
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index saved_searches_user_idx on public.saved_searches (user_id);

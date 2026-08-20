-- Explicit, stored poster identity for a listing: 'owner' | 'agent' | 'agency'.
-- Fully decoupled from profiles.role (see 0056_retire_owner_role.sql, which
-- stays untouched — that migration governs account permissions, not this).
-- Reconstructable today from listings.agent_id (null = owner-submitted) and
-- agent_profiles.agency_id (null = independent agent, set = agency-affiliated),
-- but that reconstruction was only ever done ad hoc and inconsistently: public
-- search (findPublic) has no such filter at all, and "My Listings" (findMine)
-- only exposes a crude 2-bucket source: 'owner_agent' | 'agency' split that
-- lumps Owner and independent Agent together. Storing it directly gives one
-- source of truth and a cheap indexed filter usable everywhere (public
-- search, My Listings, Admin, listing cards/detail).
--
-- Partition is a clean 3-way split (product decision): 'owner' — anyone;
-- 'agent' — independent agents only (no agency); 'agency' — agency-affiliated
-- agents only. An agency-affiliated agent has no bare-'agent' option; they
-- either post as 'owner' (a property they personally own) or 'agency'.

create type public.listing_poster_type as enum ('owner', 'agent', 'agency');

alter table public.listings add column poster_type public.listing_poster_type;

-- One-time backfill of existing rows from agent_id / agent_profiles.agency_id.
update public.listings l
set poster_type = case
  when l.agent_id is null then 'owner'::public.listing_poster_type
  when ap.agency_id is not null then 'agency'::public.listing_poster_type
  else 'agent'::public.listing_poster_type
end
from public.agent_profiles ap
where l.agent_id = ap.id;

update public.listings set poster_type = 'owner'::public.listing_poster_type where agent_id is null and poster_type is null;

alter table public.listings alter column poster_type set not null;
alter table public.listings alter column poster_type set default 'owner';

create index listings_poster_type_idx on public.listings (poster_type);

-- Data-integrity trigger: enforce the 3-way partition invariant at the DB
-- layer too, not just app-layer validation (services/api's ListingsRepository
-- also validates before insert/update for a friendlier error message — this
-- trigger is the backstop for any other write path, including direct SQL).
create or replace function public.enforce_listing_poster_type()
returns trigger
language plpgsql
as $$
declare
  v_agency_id uuid;
begin
  if new.poster_type = 'owner' and new.agent_id is not null then
    raise exception 'poster_type=owner requires agent_id to be null';
  end if;

  if new.poster_type in ('agent', 'agency') and new.agent_id is null then
    raise exception 'poster_type=% requires agent_id to be set', new.poster_type;
  end if;

  if new.agent_id is not null then
    select agency_id into v_agency_id from public.agent_profiles where id = new.agent_id;

    if new.poster_type = 'agency' and v_agency_id is null then
      raise exception 'poster_type=agency requires the agent to be agency-affiliated';
    end if;

    if new.poster_type = 'agent' and v_agency_id is not null then
      raise exception 'poster_type=agent is not allowed for an agency-affiliated agent; use agency';
    end if;
  end if;

  return new;
end;
$$;

create trigger listings_poster_type_check
before insert or update on public.listings
for each row execute function public.enforce_listing_poster_type();

-- A real, short, human-readable listing reference number — the previous
-- "readable ID" was just a truncated UUID slice (#27AEDB08), which isn't
-- actually meaningful or even re-searchable (search did exact UUID
-- equality). This is a genuine sequential identity column: Postgres
-- auto-backfills existing rows and auto-assigns the next value on every
-- future insert, no application code needed to generate/track it.
alter table public.listings add column listing_number bigint generated always as identity;
alter table public.listings add constraint listings_listing_number_key unique (listing_number);

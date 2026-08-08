-- Public "Agents" directory (apps/web /agents) groups agencies into
-- Titanium/Featured placements above the plain directory — a deliberate,
-- Super Admin-curated ranking (set via PATCH /agencies/:id/tier), not
-- computed from listing counts, so placement can't be gamed by just
-- posting more listings. Every existing/new agency defaults to 'basic'.
create type public.agency_tier as enum ('titanium', 'featured', 'basic');

alter table public.agencies add column tier public.agency_tier not null default 'basic';

-- Defense-in-depth for the genuinely private, user-scoped tables added in
-- 0007/0009 (favorites, saved_searches, notifications) — same rationale as
-- 0004_rls_policies.sql: the NestJS API (service-role key) is the primary
-- enforcement point, this just holds the line if anything ever queries
-- Postgres directly with the anon/authenticated key. Agencies/projects/
-- agent_reviews are intentionally public-read data, so they don't need RLS.

alter table public.favorites enable row level security;
alter table public.saved_searches enable row level security;
alter table public.notifications enable row level security;

create policy favorites_owner_only on public.favorites
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy saved_searches_owner_only on public.saved_searches
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notifications_owner_only on public.notifications
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

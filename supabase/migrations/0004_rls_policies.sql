-- Defense-in-depth per blueprint §3.3: the NestJS API (using the service-role
-- key) is the primary enforcement point via ScopeGuard + repository-level
-- scoping, and bypasses RLS entirely. These policies exist so that if any
-- client ever queried Postgres directly with the anon/authenticated key
-- (bypassing the API), agent isolation and public-listing filtering would
-- still hold at the database level.

alter table public.listings enable row level security;
alter table public.leads enable row level security;
alter table public.verification_audit_log enable row level security;

create policy listings_public_verified_only on public.listings
  for select
  to anon, authenticated
  using (
    status = 'verified'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    or owner_id = auth.uid()
  );

create policy leads_agent_isolation on public.leads
  for select
  to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    or agent_id::text = (auth.jwt() -> 'app_metadata' ->> 'agent_id')
  );

create policy verification_audit_staff_only on public.verification_audit_log
  for select
  to authenticated
  using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('verification_staff', 'super_admin')
  );

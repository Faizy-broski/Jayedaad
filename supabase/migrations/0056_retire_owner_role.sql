-- Product decision (revising 0055): signup goes back to defaulting every
-- new account to 'buyer' (browse-only) — the earlier "instant agent on
-- signup" change is reverted. A buyer still auto-promotes the moment they
-- post their first listing, same trigger point as before, but now lands on
-- 'agent' instead of a separate 'owner' role — 'owner' is retired going
-- forward. Every EXISTING 'owner' account is migrated to 'agent' here too
-- (unlike 0028's role backfill, this is a real one-time data change, not
-- just a JWT-claim mirror).
--
-- 'owner' stays in the public.app_role Postgres enum — Postgres has no
-- ALTER TYPE ... DROP VALUE; removing it would mean recreating the type and
-- every dependent column/constraint, a materially riskier migration than
-- just never assigning it again. The application layer (see the paired
-- code changes) stops referencing it as a live role; the enum value is
-- inert dead weight in the schema, not a functional risk.

-- 1. Revert the signup-time default back to 'buyer', and drop the
--    agent_profiles auto-provisioning branch — it only ever fired for a
--    self-signup with no explicit role, which now always resolves to
--    'buyer' again, so that branch is dead with the default reverted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role := coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'buyer');
begin
  insert into public.profiles (id, role, email, display_name, email_verified, phone, marketing_opt_in, terms_accepted_at)
  values (
    new.id,
    v_role,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_app_meta_data ->> 'display_name'),
    coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'google',
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, true),
    (new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz
  );

  if new.raw_app_meta_data ->> 'role' is null then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', v_role)
    where id = new.id;
  end if;

  return new;
end;
$$;

alter table public.profiles alter column role set default 'buyer';

-- 2. One-time migration: every existing role='owner' profile becomes
--    'agent', provisioned with a real agent_profiles row (mirrors the
--    shape services/api's applyAsAgent() produces for a fresh application:
--    only user_id/display_name/phone set, verification_status keeps its
--    table default of 'pending') so agent_id-keyed features (listing
--    create/quota, dashboard, CRM) work immediately for these accounts,
--    not just the role label.
do $$
declare
  r record;
  v_agent_id uuid;
begin
  for r in select id, display_name, phone from public.profiles where role = 'owner' loop
    -- A prior applyAsAgent()/registerSelfService() attempt could already
    -- have given this same user an agent_profiles row without the role
    -- column having caught up (the exact class of race fixed elsewhere
    -- this session) — reuse it instead of colliding on the unique
    -- constraint, same idempotent pattern as the code-side fix.
    select id into v_agent_id from public.agent_profiles where user_id = r.id;

    if v_agent_id is null then
      insert into public.agent_profiles (user_id, display_name, phone)
      values (r.id, r.display_name, r.phone)
      returning id into v_agent_id;
    end if;

    update public.profiles set role = 'agent', agent_id = v_agent_id where id = r.id;

    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', 'agent', 'agent_id', v_agent_id)
    where id = r.id;

    v_agent_id := null;
  end loop;
end $$;

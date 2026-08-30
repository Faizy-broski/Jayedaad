-- Product decision: every new signup gets agent-level access immediately
-- (dashboard, Post Listing, CRM) instead of landing on the browse-only
-- buyer area (/account/saved) first. Matches Zameen's model — one account,
-- no separate "become an agent" gate before you can list. This re-applies
-- 0055_default_signup_role_agent.sql's behavior, which 0056_retire_owner_role
-- reverted the same day it was introduced (that revert bundled it with
-- retiring the separate 'owner' role — no bug/incident drove it, per that
-- migration's own comment and commit message). Rebuilt here directly on top
-- of the current handle_new_user() (0059_email_verified_app_metadata.sql),
-- not a literal revert of 0056, since 'owner' stays retired.
--
-- This doesn't remove or gate anything buyer-specific: role='agent' already
-- has /account/saved access too (middleware.ts's PROTECTED_ROUTES — a plain
-- agent can still favorite/save searches/request a property like a buyer),
-- and posting a listing already lets the user choose posterType
-- ('owner'/'agent'/'agency' — apps/web/app/(agent)/submit's
-- posterTypeOptions) independent of the account's own role. 'buyer' role
-- itself is untouched (still a valid app_role, DEFAULT_LANDING_BY_ROLE
-- entry, and middleware gate) for any account explicitly created with it
-- (e.g. services/api's admin-created users) — only the *default* for a
-- genuine self-service signup with no explicit role changes.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role := coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'agent');
  v_email_verified boolean := coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'google';
  v_agent_id uuid;
begin
  insert into public.profiles (id, role, email, display_name, email_verified, phone, marketing_opt_in, terms_accepted_at)
  values (
    new.id,
    v_role,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_app_meta_data ->> 'display_name'),
    v_email_verified,
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, true),
    (new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz
  );

  -- Only for genuine self-service signups (no explicit role already passed
  -- in) — an admin-created account (services/api's UsersRepository.create())
  -- always supplies an explicit role and provisions its own agent_profiles
  -- row itself; this must NOT also fire there, or agent_profiles.user_id's
  -- unique constraint collides on a duplicate insert. Mirrors the exact
  -- shape AgentsRepository.applyAsAgent()/OwnersRepository.promoteToOwner()
  -- already produce for a fresh application: only user_id/display_name set,
  -- everything else (phone, city, bio, agency_id) left null,
  -- verification_status keeps its table default of 'pending' until the
  -- user uploads ID documents.
  if new.raw_app_meta_data ->> 'role' is null and v_role = 'agent' then
    insert into public.agent_profiles (user_id, display_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
    )
    returning id into v_agent_id;

    update public.profiles set agent_id = v_agent_id where id = new.id;
  end if;

  if new.raw_app_meta_data ->> 'role' is null or v_email_verified then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || case when new.raw_app_meta_data ->> 'role' is null then jsonb_build_object('role', v_role) else '{}'::jsonb end
      || case when v_agent_id is not null then jsonb_build_object('agent_id', v_agent_id) else '{}'::jsonb end
      || case when v_email_verified then jsonb_build_object('email_verified', true) else '{}'::jsonb end
    where id = new.id;
  end if;

  return new;
end;
$$;

-- Cosmetic/defensive only — the trigger above always supplies an explicit
-- role regardless of this column default, but leaving it at 'buyer' would
-- be misleading to anyone reading the schema directly.
alter table public.profiles alter column role set default 'agent';

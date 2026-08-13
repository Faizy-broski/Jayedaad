-- Product decision: every new signup gets agent-level access immediately
-- (dashboard, Post Listing, CRM) instead of a browse-only 'buyer' role that
-- required a separate "Apply to become an agent" step. This is a smaller
-- change than it looks: role was already granted instantly today when a
-- buyer clicked "Become an agent" (agents.repository.ts's applyAsAgent()) —
-- Super Admin/verification_staff approval only ever unlocked a "Verified"
-- badge, never functional access, and posting is already free (Lite tier
-- fallback, entitlements.service.ts) with no purchase gate. So this mainly
-- means: auto-run the DB-level equivalent of applyAsAgent() at signup time
-- instead of waiting for a manual click.
--
-- Existing already-registered 'buyer' accounts are untouched — this only
-- changes the default for new signups going forward (no bulk UPDATE, unlike
-- 0028's one-time backfill).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role := coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'agent');
  v_agent_id uuid;
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

  -- Only for genuine self-service signups (no explicit role already set —
  -- same guard 0028 already used for the JWT mirror below). An admin-created
  -- account (services/api's UsersRepository.create()) always passes an
  -- explicit role and creates its own agent_profiles row itself — this must
  -- NOT also fire there, or agent_profiles.user_id's unique constraint
  -- would collide on a duplicate insert.
  if new.raw_app_meta_data ->> 'role' is null then
    -- v_role defaults to 'agent' above, so every fresh signup needs a real
    -- agent_profiles row too — dashboard/CRM/listing-create all key off
    -- agent_profiles.id (app_metadata.agent_id), not just role. Mirrors the
    -- exact shape applyAsAgent() (agents.repository.ts) already produces for
    -- a fresh application: only user_id/display_name set, everything else
    -- (phone, city, bio, agency_id) left null, verification_status keeps
    -- its table default of 'pending' until the user uploads ID documents.
    if v_role = 'agent' then
      insert into public.agent_profiles (user_id, display_name)
      values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
      )
      returning id into v_agent_id;

      update public.profiles set agent_id = v_agent_id where id = new.id;
    end if;

    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', v_role)
      || case when v_agent_id is not null then jsonb_build_object('agent_id', v_agent_id) else '{}'::jsonb end
    where id = new.id;
  end if;

  return new;
end;
$$;

-- Cosmetic/defensive only — the trigger above always supplies an explicit
-- role regardless of this column default, but leaving it at the old 'buyer'
-- default would be misleading to anyone reading the schema directly.
alter table public.profiles alter column role set default 'agent';

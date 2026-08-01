-- Fixes a real bug: handle_new_user() (0002/0013/0015) computes a default
-- role ('buyer') for the profiles table but never propagated it back onto
-- auth.users.raw_app_meta_data — so getUserRole(user)
-- (packages/core/src/services/authService.ts, reads user.app_metadata.role)
-- returned undefined for every plain signup, on both web and mobile. Only
-- accounts that went through an explicit auth.admin.updateUserById() call
-- (e.g. agency self-registration flipping role -> 'agent') ever had a role
-- claim in their JWT.
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

  -- Mirror the computed default back onto the user's own app_metadata so
  -- it actually lands in the JWT. Merge (||), not overwrite, so
  -- provider/other existing app_metadata keys survive. Only fires when
  -- role is genuinely absent — an explicit signup-time role (rare, but
  -- raw_app_meta_data ->> 'role' can already be set by an admin-created
  -- account) is left alone.
  if new.raw_app_meta_data ->> 'role' is null then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', v_role)
    where id = new.id;
  end if;

  return new;
end;
$$;

-- One-time backfill for every existing account this already bit — sourced
-- from profiles.role, which was always computed correctly, just never
-- mirrored onto the JWT. Existing sessions/cached tokens won't pick this up
-- until the user next signs in or the app calls refreshSession() — this
-- only fixes the stored claim, not already-issued JWTs.
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role)
from public.profiles p
where p.id = u.id
  and (u.raw_app_meta_data ->> 'role') is null;

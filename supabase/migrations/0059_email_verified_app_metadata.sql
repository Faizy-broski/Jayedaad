-- email_verified moves into app_metadata (JWT claim) alongside role/agent_id
-- (see 0028_backfill_app_metadata_role.sql for the same pattern) so clients
-- can read it with zero network round trips instead of a per-login
-- GET /auth/otp/status call. services/api's OtpRepository.markEmailVerified
-- now stamps this for password-signup users once they pass OTP; this
-- migration covers the other branch — Google-provisioned users, who are
-- pre-verified at signup and never go through the OTP flow at all, so
-- nothing else would ever set this claim for them. profiles.email_verified
-- stays as-is (still written, no longer read by any client) — not removed,
-- to avoid unnecessary scope/risk in this pass.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role := coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'buyer');
  v_email_verified boolean := coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'google';
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

  if new.raw_app_meta_data ->> 'role' is null or v_email_verified then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
      || case when new.raw_app_meta_data ->> 'role' is null then jsonb_build_object('role', v_role) else '{}'::jsonb end
      || case when v_email_verified then jsonb_build_object('email_verified', true) else '{}'::jsonb end
    where id = new.id;
  end if;

  return new;
end;
$$;

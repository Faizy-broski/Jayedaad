-- New signup fields (Zameen-reference redesign): phone, marketing consent,
-- terms-agreement timestamp. Client-supplied at signup time via Supabase's
-- signUp(...).options.data, which lands in auth.users.raw_user_meta_data.
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists marketing_opt_in boolean not null default true;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;

-- Password reset (services/api/src/auth/password-reset) reuses this same
-- table/mechanism as email verification, for a different purpose — without
-- this column, "the latest active code for this user" would be ambiguous
-- between an in-flight email-verification code and an in-flight
-- password-reset code, and the two must never be handled interchangeably
-- (one flips profiles.email_verified, the other changes the password).
alter table public.email_otp_codes add column if not exists purpose text not null default 'email_verification';
alter table public.email_otp_codes drop constraint if exists email_otp_codes_purpose_check;
alter table public.email_otp_codes add constraint email_otp_codes_purpose_check
  check (purpose in ('email_verification', 'password_reset'));

-- Fixes a pre-existing bug while touching this function anyway: display_name
-- was only ever sourced from raw_app_meta_data, which is admin-API-only and
-- never client-writable — so it silently never worked from any signup form.
-- This pass adds the first real UI path that sets a name at signup, so it
-- must actually persist. phone/marketing_opt_in/terms_accepted_at are new,
-- correctly sourced from raw_user_meta_data (the client-writable column) from
-- the start.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email, display_name, email_verified, phone, marketing_opt_in, terms_accepted_at)
  values (
    new.id,
    coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'buyer'),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_app_meta_data ->> 'display_name'),
    coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'google',
    new.raw_user_meta_data ->> 'phone',
    coalesce((new.raw_user_meta_data ->> 'marketing_opt_in')::boolean, true),
    (new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz
  );
  return new;
end;
$$;

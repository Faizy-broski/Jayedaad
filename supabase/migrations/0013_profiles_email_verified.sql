-- Custom OTP email verification (services/api/src/auth/otp) — NOT Supabase's
-- built-in confirm-email flow. "Confirm email" is turned off in the Supabase
-- dashboard so signUp() returns an active session immediately; this column is
-- the real gate the app checks post-signup instead of auth.users.email_confirmed_at.
alter table public.profiles add column if not exists email_verified boolean not null default false;

-- Existing accounts predate this column — don't retroactively lock anyone out.
update public.profiles set email_verified = true;

-- Google-provisioned users are pre-verified by Google; password signups start
-- unverified until they pass the OTP check in email_otp_codes.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email, display_name, email_verified)
  values (
    new.id,
    coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'buyer'),
    new.email,
    new.raw_app_meta_data ->> 'display_name',
    coalesce(new.raw_app_meta_data ->> 'provider', 'email') = 'google'
  );
  return new;
end;
$$;

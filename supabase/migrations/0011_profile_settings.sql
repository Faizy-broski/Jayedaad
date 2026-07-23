-- Confirmed real on the Profolio "User Settings" and "Preferences" pages.
-- The "Individual" badge shown next to the user's name on User Settings is
-- NOT a new field — already derivable from agent_profiles.agency_id IS NULL
-- (independent agent vs. agency-affiliated), built in an earlier pass.
-- Change Password needs no schema/API work at all — entirely a Supabase
-- Auth concern (supabase.auth.updateUser({ password })).

alter table public.agent_profiles
  add column whatsapp text,
  add column landline text,
  add column address text,
  add column city text;
-- NOTE: the existing `phone` column already covers the real "Mobile" field.

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email_notifications boolean not null default true,
  newsletters boolean not null default false,
  automated_reports boolean not null default false,
  preferred_currency text not null default 'PKR',
  preferred_area_unit public.area_unit not null default 'marla'
);

alter table public.user_preferences enable row level security;
create policy user_preferences_owner_only on public.user_preferences
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

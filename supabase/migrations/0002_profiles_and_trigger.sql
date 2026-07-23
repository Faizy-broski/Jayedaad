-- App-specific identity data layered on top of Supabase Auth's auth.users.
-- Role/agent_id are also mirrored into the JWT via raw_app_meta_data (set at
-- signup/invite time through the service-role Admin API) so JwtAuthGuard can
-- read them straight off the token with no extra DB round trip per request —
-- this table exists for SQL joins/admin listing, not as the auth source of truth.

-- email/display_name: a lightweight denormalized copy for admin listing (the
-- Super Admin "team members" screen) so listing internal staff doesn't need
-- an N+1 Admin API call per row — email is always available (every signup
-- path uses email/password), display_name is optional (only set when the
-- creator supplied one via CreateUserDto.displayName).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'buyer',
  agent_id uuid references public.agent_profiles (id),
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, email, display_name)
  values (
    new.id,
    coalesce((new.raw_app_meta_data ->> 'role')::public.app_role, 'buyer'),
    new.email,
    new.raw_app_meta_data ->> 'display_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

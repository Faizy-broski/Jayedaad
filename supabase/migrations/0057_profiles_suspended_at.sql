-- Super Admin's "Suspend"/"Unsuspend" (admin/users/page.tsx) already calls
-- Supabase Auth's real admin ban mechanism (auth.admin.updateUserById with
-- ban_duration — see users.repository.ts), so it correctly blocks future
-- sign-ins. But nothing tracked *current* suspension state anywhere
-- queryable — profiles had no such column, so the Users page couldn't tell
-- who's actually suspended and always rendered both Suspend and Unsuspend
-- buttons for every user regardless of real state.
--
-- Deliberately not sourced from auth.users.banned_until directly — that
-- would mean either an extra Admin API round-trip per row or per page, or a
-- join Supabase's REST layer doesn't support against auth.users. This
-- column is set/cleared in lockstep with the ban_duration call in
-- users.repository.ts's suspend()/unsuspend(), so it stays a simple,
-- cheap, directly-queryable mirror of that state.
alter table public.profiles
  add column if not exists suspended_at timestamptz null;

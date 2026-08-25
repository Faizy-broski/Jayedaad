-- Lets the API force a user's existing sessions to stop refreshing after an
-- admin-initiated role change (users.repository.ts's updateRole()).
--
-- There is no user-ID-based "sign the user out everywhere" call in the
-- @supabase/supabase-js Admin API — GoTrueAdminApi.signOut(jwt, scope) takes
-- the session's own access token, which the backend doesn't have here (it
-- only has the target user's ID). The reliable, ID-based mechanism is to
-- delete that user's rows from auth.refresh_tokens directly: with no valid
-- refresh token left, their next silent token refresh fails and the client
-- is forced into a real re-login, picking up the new app_metadata.role.
--
-- Same limitation as suspend()/unsuspend()'s ban_duration a few lines away
-- in users.repository.ts: this does NOT invalidate an *access* token
-- already in the client's hands — that stays valid until its own natural
-- expiry (short-lived, typically ~1h). It closes the "silently stale for an
-- unpredictable amount of time" gap down to that bound instead of leaving it
-- open-ended until the client's next background refresh happens to land.
create or replace function public.revoke_user_sessions(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.refresh_tokens where user_id = target_user_id::text;
end;
$$;

-- Callable only via the service-role client (services/api's SupabaseService)
-- — never exposed to authenticated/anon roles.
revoke all on function public.revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.revoke_user_sessions(uuid) to service_role;

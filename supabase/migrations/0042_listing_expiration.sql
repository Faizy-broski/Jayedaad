-- Listing expiration tied to the assigned agent's plan — previously
-- 'expired' was a valid listings.status value (0001_init.sql) that nothing
-- anywhere ever actually set; a listing stayed live forever regardless of
-- plan. This closes that gap end-to-end: each plan defines how many days a
-- listing stays live once verified, a listing records when it expires, and
-- PlanLifecycleService's existing cron (services/api/src/subscriptions/
-- plan-lifecycle.service.ts) sweeps expired ones.

-- Null = unlimited (listing never expires on this plan) — a real, distinct
-- value from 0, not a magic number.
alter table public.subscription_tiers add column listing_duration_days int;

-- Set when a listing is approved (record_verification_action() below) or
-- renewed (POST /listings/:id/renew) — null for owner-only listings (no
-- agent, no plan to derive a duration from) or a plan with unlimited
-- duration.
alter table public.listings add column expires_at timestamptz;

-- Seed defaults for the 4 named plans — same "starting default, editable
-- anytime in the admin Plans page" convention as every other per-plan
-- number (0041_plan_production_ready.sql). Ultimate stays null (unlimited)
-- deliberately, not just omitted.
update public.subscription_tiers set listing_duration_days = 30 where name = 'Lite';
update public.subscription_tiers set listing_duration_days = 60 where name = 'Go';
update public.subscription_tiers set listing_duration_days = 90 where name = 'Pro';

-- Replaces the function from 0003_rpc_functions.sql — same atomic
-- status-update + audit-log-insert contract, now also computing expires_at
-- when an approval actually transitions a listing to 'verified'. Falls back
-- to the Lite plan's duration if the agent has no active subscription row,
-- mirroring EntitlementsService.getDefaultEntitlements()'s exact fallback
-- convention (single source of truth for "what does an unsubscribed agent
-- get" stays the Lite tier's own numbers, not a separate hardcoded default).
create or replace function public.record_verification_action(
  p_listing_id uuid,
  p_reviewer_id uuid,
  p_action public.verification_action,
  p_note text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_status public.listing_status;
  v_agent_id uuid;
  v_duration_days int;
begin
  v_new_status := case p_action
    when 'approve' then 'verified'
    when 'reject' then 'rejected'
    else 'pending_verification'
  end;

  if v_new_status = 'verified' then
    select agent_id into v_agent_id from public.listings where id = p_listing_id;

    if v_agent_id is not null then
      select st.listing_duration_days into v_duration_days
      from public.subscriptions s
      join public.subscription_tiers st on st.id = s.tier_id
      where s.agent_id = v_agent_id and s.status = 'active'
      limit 1;

      if not found then
        select listing_duration_days into v_duration_days from public.subscription_tiers where name = 'Lite';
      end if;
    else
      v_duration_days := null; -- owner-only listing — no plan, never expires
    end if;

    update public.listings
    set status = v_new_status,
        expires_at = case when v_duration_days is not null then now() + (v_duration_days || ' days')::interval else null end
    where id = p_listing_id;
  else
    update public.listings set status = v_new_status where id = p_listing_id;
  end if;

  insert into public.verification_audit_log (listing_id, reviewer_id, action, note)
  values (p_listing_id, p_reviewer_id, p_action, p_note);
end;
$$;

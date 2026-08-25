-- Atomic multi-table writes for opportunities — same discipline as
-- 0003_rpc_functions.sql's update_lead_status/assign_lead/add_lead_note:
-- called from NestJS via supabase.rpc(...) so a history/activity row can
-- never be silently dropped relative to its parent write.

-- Promotes an existing lead to a new opportunity. Seeds probability from
-- opportunity_stage_config (always 'qualification' on creation), logs one
-- opportunity_stage_history row (null -> 'qualification') and one
-- lead_activity row on the SOURCE lead so its own timeline shows the
-- promotion. Eligibility (lead status must be contacted/negotiating, no
-- active opportunity already exists) is checked in Nest before this is
-- called — the partial unique index on opportunities.lead_id is the
-- database-level backstop for the latter, not re-checked here.
create or replace function public.convert_lead_to_opportunity(
  p_lead_id uuid,
  p_name text,
  p_value numeric,
  p_expected_close_date date,
  p_agent_id uuid,
  p_agency_id uuid,
  p_listing_id uuid,
  p_project_id uuid,
  p_created_by uuid,
  p_deal_type public.deal_type default 'sale'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_probability numeric;
  v_opportunity_id uuid;
begin
  select default_probability into v_probability from public.opportunity_stage_config where stage = 'qualification';

  insert into public.opportunities (
    lead_id, name, value, expected_close_date, agent_id, agency_id, listing_id, project_id, probability, created_by, deal_type
  )
  values (
    p_lead_id, p_name, p_value, p_expected_close_date, p_agent_id, p_agency_id, p_listing_id, p_project_id, v_probability, p_created_by, p_deal_type
  )
  returning id into v_opportunity_id;

  insert into public.opportunity_stage_history (opportunity_id, from_stage, to_stage, changed_by)
  values (v_opportunity_id, null, 'qualification', p_created_by);

  insert into public.lead_activity (lead_id, type)
  values (p_lead_id, 'opportunity_converted');

  return v_opportunity_id;
end;
$$;

-- Direct-creation path (no source lead) — same insert shape minus the
-- lead-side bookkeeping, since there is no lead to log against.
create or replace function public.create_opportunity(
  p_name text,
  p_value numeric,
  p_expected_close_date date,
  p_agent_id uuid,
  p_agency_id uuid,
  p_listing_id uuid,
  p_project_id uuid,
  p_created_by uuid,
  p_deal_type public.deal_type default 'sale'
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_probability numeric;
  v_opportunity_id uuid;
begin
  select default_probability into v_probability from public.opportunity_stage_config where stage = 'qualification';

  insert into public.opportunities (
    name, value, expected_close_date, agent_id, agency_id, listing_id, project_id, probability, created_by, deal_type
  )
  values (
    p_name, p_value, p_expected_close_date, p_agent_id, p_agency_id, p_listing_id, p_project_id, v_probability, p_created_by, p_deal_type
  )
  returning id into v_opportunity_id;

  insert into public.opportunity_stage_history (opportunity_id, from_stage, to_stage, changed_by)
  values (v_opportunity_id, null, 'qualification', p_created_by);

  return v_opportunity_id;
end;
$$;

-- Moves an opportunity to a new stage — update + history insert, atomic,
-- mirrors update_lead_status exactly. Re-seeds `probability` from
-- opportunity_stage_config on every transition (an agent can still hand-
-- edit it afterward via a separate PATCH — this only resets it at the
-- moment of a stage change, matching how a fresh stage's own default
-- likelihood should apply until someone overrides it).
--
-- Deliberately does NOT create a `deals` row when p_to_stage = 'won' —
-- that happens in Nest (OpportunitiesRepository.updateStage), which reuses
-- DealsRepository's existing commission-resolution logic rather than
-- forking it into SQL, then calls THIS function to flip the stage/history/
-- deal_id together in one statement. Transition legality (forward-only,
-- any non-terminal -> 'lost', terminal states have no further moves) is
-- validated in Nest before this is ever called.
create or replace function public.update_opportunity_stage(
  p_opportunity_id uuid,
  p_to_stage public.opportunity_stage,
  p_changed_by uuid,
  p_deal_id uuid default null,
  p_lost_reason text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_stage public.opportunity_stage;
  v_probability numeric;
begin
  select stage into v_from_stage from public.opportunities where id = p_opportunity_id;
  select default_probability into v_probability from public.opportunity_stage_config where stage = p_to_stage;

  update public.opportunities
  set stage = p_to_stage,
      probability = v_probability,
      deal_id = coalesce(p_deal_id, deal_id),
      lost_reason = case when p_to_stage = 'lost' then p_lost_reason else lost_reason end,
      updated_at = now()
  where id = p_opportunity_id;

  insert into public.opportunity_stage_history (opportunity_id, from_stage, to_stage, changed_by)
  values (p_opportunity_id, v_from_stage, p_to_stage, p_changed_by);
end;
$$;

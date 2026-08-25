-- Atomic multi-table write for logging an activity — same discipline as
-- 0003_rpc_functions.sql's add_lead_note: inserts the real content row
-- (activity_log_entries) then a pointer row into lead_activity and/or
-- opportunity_activity so each timeline's own existing query shape (join
-- against its parent) keeps working unchanged.
create or replace function public.log_activity(
  p_lead_id uuid,
  p_opportunity_id uuid,
  p_type public.lead_activity_type,
  p_logged_by uuid,
  p_occurred_at timestamptz,
  p_summary text,
  p_outcome text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry_id uuid;
begin
  insert into public.activity_log_entries (lead_id, opportunity_id, type, logged_by, occurred_at, summary, outcome)
  values (p_lead_id, p_opportunity_id, p_type, p_logged_by, coalesce(p_occurred_at, now()), p_summary, p_outcome)
  returning id into v_entry_id;

  if p_lead_id is not null then
    insert into public.lead_activity (lead_id, type, ref_id)
    values (p_lead_id, p_type, v_entry_id::text);
  end if;

  if p_opportunity_id is not null then
    insert into public.opportunity_activity (opportunity_id, type, ref_id)
    values (p_opportunity_id, p_type, v_entry_id);
  end if;

  return v_entry_id;
end;
$$;

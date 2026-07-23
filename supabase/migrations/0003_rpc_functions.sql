-- Atomic multi-table writes that used to be Prisma $transaction calls.
-- Called from NestJS via supabase.rpc(...) so an audit/history row can never
-- be silently dropped relative to its parent write [Dev Instr §2.2].

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
begin
  v_new_status := case p_action
    when 'approve' then 'verified'
    when 'reject' then 'rejected'
    else 'pending_verification'
  end;

  update public.listings set status = v_new_status where id = p_listing_id;

  insert into public.verification_audit_log (listing_id, reviewer_id, action, note)
  values (p_listing_id, p_reviewer_id, p_action, p_note);
end;
$$;

create or replace function public.update_lead_status(
  p_lead_id uuid,
  p_to_status public.lead_status,
  p_changed_by uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_status public.lead_status;
begin
  select status into v_from_status from public.leads where id = p_lead_id;

  update public.leads set status = p_to_status where id = p_lead_id;

  insert into public.lead_status_history (lead_id, from_status, to_status, changed_by)
  values (p_lead_id, v_from_status, p_to_status, p_changed_by);

  insert into public.lead_activity (lead_id, type)
  values (p_lead_id, 'status_change');
end;
$$;

-- J.Team assigns/reassigns a lead to an agent [Dev Instr §3.2]. Updates the
-- denormalized "current assignee" on leads, logs the event in
-- lead_assignments (assignment history), and appends to lead_activity —
-- all in the same atomic write.
create or replace function public.assign_lead(
  p_lead_id uuid,
  p_agent_id uuid,
  p_assigned_by uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.leads set agent_id = p_agent_id where id = p_lead_id;

  insert into public.lead_assignments (lead_id, agent_id, assigned_by)
  values (p_lead_id, p_agent_id, p_assigned_by);

  insert into public.lead_activity (lead_id, type)
  values (p_lead_id, 'assignment');
end;
$$;

create or replace function public.add_lead_note(
  p_lead_id uuid,
  p_author_id uuid,
  p_body text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.lead_notes (lead_id, author_id, body)
  values (p_lead_id, p_author_id, p_body);

  insert into public.lead_activity (lead_id, type)
  values (p_lead_id, 'note');
end;
$$;

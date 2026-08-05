-- Preview first — run this block and confirm these are the right accounts
-- before running the deletion below.

select id, email, created_at from auth.users
where email in ('mhuzaifawebdev@gmail.com', 'mhuzaifa381a@gmail.com');

select l.id, l.title, l.status from public.listings l
join auth.users u on u.id = l.owner_id
where u.email in ('mhuzaifawebdev@gmail.com', 'mhuzaifa381a@gmail.com');

select ap.id, ap.display_name from public.agent_profiles ap
join auth.users u on u.id = ap.user_id
where u.email in ('mhuzaifawebdev@gmail.com', 'mhuzaifa381a@gmail.com');


-- ============================================================
-- DESTRUCTIVE — permanently deletes these two accounts and all
-- owned data (listings, media, documents, leads, reviews, etc).
-- Wrapped in a transaction: if anything errors, it all rolls back.
-- ============================================================

begin;

do $$
declare
  v_user_ids uuid[];
  v_agent_ids uuid[];
begin
  select array_agg(id) into v_user_ids
  from auth.users
  where email in ('mhuzaifawebdev@gmail.com', 'mhuzaifa381a@gmail.com');

  if v_user_ids is null then
    raise notice 'No matching users found — nothing to do.';
    return;
  end if;

  select array_agg(id) into v_agent_ids
  from public.agent_profiles
  where user_id = any(v_user_ids);

  -- 1. Notifications referencing content this user is about to lose.
  delete from public.notifications
  where related_listing_id in (
          select id from public.listings
          where owner_id = any(v_user_ids) or agent_id = any(v_agent_ids)
        )
     or related_lead_id in (
          select id from public.leads
          where listing_id in (select id from public.listings where owner_id = any(v_user_ids))
             or agent_id = any(v_agent_ids)
        );

  -- 2. Verification audit log for listings about to be deleted, and any
  --    rows where this user acted as a staff reviewer.
  delete from public.verification_audit_log
  where listing_id in (select id from public.listings where owner_id = any(v_user_ids))
     or reviewer_id = any(v_user_ids);

  -- 3. Leads tied to this user's listings, or assigned to this user as
  --    agent (lead_notes/lead_status_history/lead_assignments/tasks and
  --    appointments.lead_id all resolve automatically from here).
  delete from public.leads
  where listing_id in (select id from public.listings where owner_id = any(v_user_ids))
     or agent_id = any(v_agent_ids);

  -- 4. Any remaining rows where this user acted directly (not tied to a
  --    lead already removed above).
  delete from public.lead_assignments where assigned_by = any(v_user_ids);
  delete from public.lead_status_history where changed_by = any(v_user_ids);
  delete from public.lead_notes where author_id = any(v_user_ids);
  delete from public.tasks where owner_id = any(v_user_ids);
  delete from public.agent_reviews where reviewer_id = any(v_user_ids);

  -- 5. Detach (don't delete) OTHER people's listings/leads that reference
  --    this user as their agent.
  update public.listings set agent_id = null where agent_id = any(v_agent_ids);
  update public.leads set agent_id = null where agent_id = any(v_agent_ids);

  -- 6. Delete this user's own listings (cascades listing_media,
  --    listing_documents, listing_contact_numbers, listing_amenities,
  --    favorites/saved_searches referencing them).
  delete from public.listings where owner_id = any(v_user_ids);

  -- 7. Finally, the auth user rows — cascades profiles, agent_profiles
  --    (and everything under it: subscriptions, agent_credits,
  --    onboarding_documents, agent_reviews.agent_id, appointments.agent_id),
  --    owner_identity_verifications, favorites, saved_searches,
  --    notifications, email_otp_codes, profile_settings, appointments.owner_id.
  delete from auth.users where id = any(v_user_ids);

  raise notice 'Deleted % user(s): %', array_length(v_user_ids, 1), v_user_ids;
end $$;

commit;

-- Projects are now creatable by agents (not just super_admin), same as
-- listings — so they need the same publish gate: a project only shows up
-- on the public GET /projects search once a Super Admin verifies it.
-- Deliberately a plain text+check rather reusing listings' full
-- pending_verification/verified/rejected/expired/... enum — projects don't
-- have listings' draft/expired/downgraded lifecycle, just a simple
-- moderation gate.
alter table public.projects
  add column verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected'));

create index projects_verification_status_idx on public.projects (verification_status);

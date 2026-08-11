-- Project detail pages previously had no enquiry path into the CRM at all
-- (leads.listing_id was a hard-required FK — leads were 100% listing-only).
-- Extends leads to also accept a project enquiry: exactly one of
-- listing_id/project_id is set, never both/neither, enforced by the check
-- constraint below (not just application code) — same defense-in-depth
-- discipline as every other constraint in this schema.
alter table public.leads add column project_id uuid references public.projects (id) on delete set null;

alter table public.leads alter column listing_id drop not null;

alter table public.leads
  add constraint leads_listing_or_project_chk
  check ((listing_id is not null) <> (project_id is not null));

create index leads_project_id_idx on public.leads (project_id);

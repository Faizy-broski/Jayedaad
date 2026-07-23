-- Verification documents — real business requirement: property/listing
-- verification requires ID card front+back, ownership proof, and a last
-- utility bill; onboarding a company/agent requires company registration,
-- owner's ID card, and a tax certificate. Only PNG/JPEG/PDF are accepted
-- (enforced server-side in documents.service.ts, not just by extension).
--
-- file_path is a Supabase Storage OBJECT KEY in a PRIVATE bucket
-- (SUPABASE_DOCUMENTS_BUCKET), not a public URL — these are PII (ID cards,
-- tax certificates). Read access always goes through a short-lived signed
-- URL generated at request time (documents.service.ts::getSignedUrl),
-- unlike photo_url/logo_url/cover_image_url elsewhere, which are public.

create type public.listing_document_type as enum ('id_card_front', 'id_card_back', 'ownership_proof', 'utility_bill');
create type public.onboarding_document_type as enum ('company_registration', 'owner_id_card', 'tax_certificate');

create table public.listing_documents (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  document_type public.listing_document_type not null,
  file_path text not null,
  uploaded_at timestamptz not null default now()
);
create index listing_documents_listing_idx on public.listing_documents (listing_id);

-- agency_id/agent_id: exactly one set, never both/neither — an
-- agency-affiliated agent is covered by their agency's own documents, only
-- independent agents (agent_profiles.agency_id is null) need their own set.
-- Same multi-nullable-FK shape already used by notifications.related_listing_id
-- / related_lead_id, rather than a generic polymorphic subject_type column.
create table public.onboarding_documents (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies (id) on delete cascade,
  agent_id uuid references public.agent_profiles (id) on delete cascade,
  document_type public.onboarding_document_type not null,
  file_path text not null,
  uploaded_at timestamptz not null default now(),
  constraint onboarding_documents_subject_xor check (
    (agency_id is not null and agent_id is null) or (agency_id is null and agent_id is not null)
  )
);
create index onboarding_documents_agency_idx on public.onboarding_documents (agency_id);
create index onboarding_documents_agent_idx on public.onboarding_documents (agent_id);

-- Deliberately RLS-enabled with NO policies: full deny for anon/authenticated,
-- only the service-role API (NestJS) can ever read/write these rows — a
-- stricter posture than the no-RLS-at-all approach used for public data like
-- agencies/projects (see 0010_rls_policies_v2.sql), appropriate given this
-- table holds PII.
alter table public.listing_documents enable row level security;
alter table public.onboarding_documents enable row level security;

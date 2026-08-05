-- Phase 1 of the Document Verification spec: individual (non-agency) owners
-- get a one-time identity check (CNIC front/back + selfie), staff-reviewed
-- exactly like agent_profiles.verification_status/onboarding_documents
-- (0001_init.sql, 0012_documents.sql) — separate table rather than reusing
-- agent_profiles since owners aren't agents and have no agency/subscription
-- concerns.

create type public.owner_identity_verification_status as enum ('pending', 'verified', 'rejected');
create type public.owner_identity_document_type as enum ('cnic_front', 'cnic_back', 'selfie');

create table public.owner_identity_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  status public.owner_identity_verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.owner_identity_documents (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.owner_identity_verifications (id) on delete cascade,
  document_type public.owner_identity_document_type not null,
  file_path text not null,
  uploaded_at timestamptz not null default now()
);
create index owner_identity_documents_verification_idx on public.owner_identity_documents (verification_id);

-- Same PII posture as listing_documents/onboarding_documents: RLS enabled,
-- zero policies — service-role (NestJS) only, never queried directly by
-- anon/authenticated clients.
alter table public.owner_identity_verifications enable row level security;
alter table public.owner_identity_documents enable row level security;

-- id_card_front/id_card_back move to the one-time owner identity flow above
-- (as cnic_front/cnic_back) instead of being required per listing; only
-- ownership_proof/utility_bill remain required per-listing documents.
comment on type public.listing_document_type is 'id_card_front/id_card_back retained for schema compatibility but no longer part of REQUIRED_LISTING_DOCUMENT_TYPES — see owner_identity_documents for the current CNIC capture flow.';

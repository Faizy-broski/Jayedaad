-- OTP codes for custom email verification (services/api/src/auth/otp) — codes
-- are generated and emailed by our own backend via nodemailer, not Supabase's
-- built-in OTP/magic-link. code_hash is SHA-256; the plaintext code is never
-- persisted. Rows are never deleted on new sends — verifyCode always reads the
-- most recent unconsumed row for a user, so old rows are just inert history.
create table if not exists public.email_otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempt_count int not null default 0,
  max_attempts int not null default 5,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists email_otp_codes_user_id_idx on public.email_otp_codes (user_id);

-- Deliberately RLS-enabled with NO policies: full deny for anon/authenticated,
-- only the service-role API can ever read/write these rows — same posture as
-- listing_documents/onboarding_documents (see 0012_documents.sql), appropriate
-- given this table gates account access.
alter table public.email_otp_codes enable row level security;

-- Atomic increment so concurrent verify attempts can't race past max_attempts
-- via a read-then-write from the API — same "mutate atomically via RPC"
-- pattern as 0003_rpc_functions.sql.
create or replace function public.increment_email_otp_attempt(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.email_otp_codes set attempt_count = attempt_count + 1 where id = p_id;
$$;

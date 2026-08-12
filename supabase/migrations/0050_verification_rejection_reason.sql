-- A rejected agent/agency/owner previously saw only the bare word
-- "rejected" on both web and mobile, with no explanation anywhere in the
-- schema — see services/api/src/{agents,agencies,owners}/*.repository.ts's
-- setVerificationStatus()/its owner equivalent, which now write this column
-- alongside status. Cleared back to null on any later approval (same
-- "no stale value lingering past the state it described" convention as
-- listings.boost_expires_at/story_expires_at) rather than kept as history —
-- there's no audit-log table for agent/agency/owner verification the way
-- listings.verification_audit_log exists, so this is the one place a
-- reason can live.
alter table public.agent_profiles add column rejection_reason text;
alter table public.agencies add column rejection_reason text;
alter table public.owner_identity_verifications add column rejection_reason text;

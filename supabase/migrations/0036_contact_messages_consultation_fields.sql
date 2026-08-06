-- Client requirement, verbatim: "Phone Number and City should be mandatory
-- fields. All other fields should remain optional." — the web Contact Us
-- "Request a Callback" form (Consultation.tsx) now submits for real. phone
-- was already nullable (shared with apps/mobile's ProjectDetailScreen
-- enquiry dialog, where it's genuinely optional); name/email/message drop
-- their not-null constraint here so the same table also accepts
-- Consultation's submissions, where only phone/city are enforced
-- (client-side, via `required`) — not by this table's constraints.
-- mobile's ContactScreen still always sends name/email/message (validated
-- client-side there), so this is purely widening what the DB accepts, not
-- a behavior change for that caller.
alter table public.contact_messages
  add column if not exists city text,
  add column if not exists purpose text,
  add column if not exists budget text,
  alter column name drop not null,
  alter column email drop not null,
  alter column message drop not null;

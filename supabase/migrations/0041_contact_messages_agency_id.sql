-- The new Agency detail page (apps/web /agents/[slug]) sends its "Send Your
-- Question" form through the same shared Contact Us intake (see
-- contact_messages_consultation_fields.sql) rather than a new table — this
-- just lets that submission carry which agency it was about. Nullable +
-- on delete set null: every other caller (Contact Us, mobile ContactScreen/
-- ProjectDetailScreen) has no agency context and must keep working
-- unchanged; losing the agency later shouldn't delete the message itself.
alter table public.contact_messages
  add column agency_id uuid references public.agencies (id) on delete set null;

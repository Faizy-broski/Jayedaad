-- Supabase Storage buckets used by services/api's upload services. These
-- were originally created ad hoc via the Storage REST API during
-- development (documents, listing-media, avatars all already exist live) —
-- this migration makes that reproducible/version-controlled like the rest
-- of the schema, and is idempotent so re-running it against the already-
-- provisioned project is a no-op.
--
-- All uploads go through the service-role key server-side (documents.service.ts,
-- listing-media.service.ts, agents/avatar-media.service.ts) — never a direct
-- client upload — so no storage.objects RLS policies are needed; the
-- service role bypasses RLS entirely.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- Verification/onboarding documents (ID cards, tax certificates) — PII,
  -- so private; reads always go through a short-lived signed URL
  -- (documents.service.ts::getSignedUrl), never a public URL.
  ('documents', 'documents', false, 10485760, array['image/png', 'image/jpeg', 'application/pdf']),

  -- Listing photos/videos — public, listing media is meant to be publicly
  -- viewable (listing-media.service.ts).
  ('listing-media', 'listing-media', true, 31457280, array[
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime'
  ]),

  -- User/agent profile pictures — own bucket rather than reusing
  -- listing-media, since avatars are images-only with a tighter size limit
  -- (agents/avatar-media.service.ts).
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

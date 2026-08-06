-- Blog post cover images bucket — mirrors 0018_storage_buckets.sql's
-- pattern exactly (public, size/MIME limits matching
-- blog-media.service.ts's MAX_BLOG_COVER_SIZE_BYTES/
-- ALLOWED_BLOG_COVER_MIME_TYPES constants). Uploads go through the
-- service-role key server-side (blog-media.service.ts) only, so no
-- storage.objects RLS policies are needed.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('blog-covers', 'blog-covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

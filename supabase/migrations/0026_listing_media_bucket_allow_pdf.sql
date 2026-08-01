-- ProjectMediaService (services/api/src/projects/project-media.service.ts)
-- reuses the listing-media bucket for project brochures and payment-plan
-- documents, and its own ALLOWED_PROJECT_MEDIA_MIME_TYPES whitelist already
-- includes application/pdf — but the bucket itself (0018_storage_buckets.sql)
-- was provisioned for listing photos/videos only, so Supabase Storage
-- rejects the upload before it ever reaches app-level validation. Only
-- adding application/pdf here; the bucket's other constraints are untouched.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'application/pdf'
]
where id = 'listing-media';

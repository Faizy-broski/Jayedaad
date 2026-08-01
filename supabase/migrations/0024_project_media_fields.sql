-- Confirmed real gaps against a live Zameen "New Projects" page
-- (zameen.com/new-projects/swiss_mall_gulberg-2196): gallery photos beyond
-- the single cover image, floor plan images, a video/3D-walkthrough link,
-- and a downloadable sales-kit brochure. gallery/floor plans are plain URL
-- arrays (no per-item label/metadata), matching how cover_image_url is
-- already just a bare URL.
alter table public.projects
  add column gallery_image_urls text[] not null default '{}',
  add column floor_plan_urls text[] not null default '{}',
  add column video_url text,
  add column brochure_url text;

-- Profile picture for plain (buyer/owner) accounts — agent_profiles already
-- has photo_url (0006_agencies_and_reviews.sql or thereabouts), but the base
-- profiles table every role shares had no equivalent, so only agents could
-- ever set an avatar.
alter table public.profiles add column if not exists photo_url text;

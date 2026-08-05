-- Document Verification Phase 4: Airbnb-style categorized mandatory media.
-- Nullable free text (not a fixed enum) — bedroom/bathroom slugs are
-- numbered dynamically per listing (bedroom_1, bedroom_2, ...), validated
-- at the API layer via a regex (see
-- services/api/src/listings/listing-media-categories.ts), not a DB enum.
-- Existing rows and videos/optional-category photos stay null.
alter table public.listing_media add column if not exists category text;

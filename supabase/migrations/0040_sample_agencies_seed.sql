-- Sample/demo data so the new public Agents directory (apps/web /agents,
-- see 0039_agency_tier.sql) isn't empty in a fresh environment. Fictitious
-- agency names — not scraped/real businesses. Safe to delete later: `delete
-- from public.agencies where slug like 'sample-%';`.
insert into public.agencies (name, slug, city, address, verification_status, tier, sales_associate_count)
values
  ('Skyline Realty Partners', 'sample-skyline-realty-partners', 'Lahore', 'MM Alam Road, Gulberg III', 'verified', 'titanium', 24),
  ('Horizon Estate & Builders', 'sample-horizon-estate-builders', 'Lahore', 'DHA Phase 5', 'verified', 'titanium', 18),
  ('Crescent Properties', 'sample-crescent-properties', 'Karachi', 'Clifton Block 5', 'verified', 'titanium', 15),
  ('Northgate Realty', 'sample-northgate-realty', 'Islamabad', 'F-7 Markaz', 'verified', 'titanium', 12),

  ('Bluewave Estates', 'sample-bluewave-estates', 'Lahore', 'Johar Town', 'verified', 'featured', 9),
  ('Emerald Homes & Builders', 'sample-emerald-homes-builders', 'Lahore', 'Bahria Town', 'verified', 'featured', 11),
  ('Silverline Realty', 'sample-silverline-realty', 'Karachi', 'DHA Phase 6', 'verified', 'featured', 7),
  ('Cedar Grove Properties', 'sample-cedar-grove-properties', 'Islamabad', 'G-9 Markaz', 'verified', 'featured', 8),
  ('Meridian Estate Consultants', 'sample-meridian-estate-consultants', 'Lahore', 'Model Town', 'verified', 'featured', 6),
  ('Oakstone Builders & Realty', 'sample-oakstone-builders-realty', 'Rawalpindi', 'Bahria Town Phase 4', 'verified', 'featured', 5),
  ('Falcon Heights Properties', 'sample-falcon-heights-properties', 'Karachi', 'Gulshan-e-Iqbal', 'verified', 'featured', 10),
  ('Riverside Estate Group', 'sample-riverside-estate-group', 'Gwadar', 'New Town', 'verified', 'featured', 4),

  ('Pinegate Realty', 'sample-pinegate-realty', 'Lahore', 'Askari 10', 'verified', 'basic', 3),
  ('Westbrook Properties', 'sample-westbrook-properties', 'Karachi', 'North Nazimabad', 'verified', 'basic', 3),
  ('Sundale Estate Partners', 'sample-sundale-estate-partners', 'Islamabad', 'E-11', 'verified', 'basic', 2),
  ('Harborview Realty', 'sample-harborview-realty', 'Gwadar', 'Marine Drive', 'verified', 'basic', 2)
on conflict (slug) do nothing;

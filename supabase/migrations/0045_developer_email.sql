-- Developers (0008_projects.sql) have never had an email column — only
-- phone/whatsapp — so the project detail page's DeveloperCard had no real
-- channel to back an "Email" quick-action; the previous "Send Enquiry"
-- button there just duplicated the enquiry form already visible on the same
-- page. Nullable/optional: existing developers keep working with Call +
-- WhatsApp only until an admin fills this in via the Developers admin page.
alter table public.developers add column email text;

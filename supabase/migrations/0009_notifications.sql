-- In-app notification feed. Both platforms centralize price-drop alerts,
-- saved-search matches, and status changes into one feed — this is also
-- what [Spec §2]'s "Push Notifications for new matches, inquiry replies,
-- and status updates" already calls for but had no backing table. This
-- table is the in-app record; actual FCM/APNs delivery is a separate,
-- later integration (see .env.example FCM_SERVER_KEY/APNS_*).

create type public.notification_type as enum (
  'price_drop',
  'new_match',
  'inquiry_reply',
  'verification_status',
  'lead_assigned',
  'reminder'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  related_listing_id uuid references public.listings (id),
  related_lead_id uuid references public.leads (id),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_unread_idx on public.notifications (user_id, read_at);

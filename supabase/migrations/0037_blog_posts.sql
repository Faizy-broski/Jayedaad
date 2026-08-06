-- Blog / Property Tips CMS — Super Admin authoring, publicly readable once
-- published. Replaces the hardcoded mock data both homepages currently use
-- (apps/web/data/articles.ts, apps/mobile/src/screens/HomeScreen.tsx's
-- local BLOG_POSTS array).

create type public.blog_post_status as enum ('draft', 'published');

-- Admin-managed lookup table, not a hardcoded enum — same pattern already
-- established for property_type_categories (services/api/src/taxonomy) —
-- so Super Admin can create new categories inline while authoring a post,
-- not just pick from a fixed list.
create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id),
  title text not null,
  slug text not null unique,
  category_id uuid references public.blog_categories (id),
  excerpt text,
  content text not null, -- TipTap HTML output
  cover_image_url text,
  read_time text, -- e.g. "5 min read", author-entered like the existing mock data
  status public.blog_post_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_status_published_idx on public.blog_posts (status, published_at desc);
create index blog_posts_category_idx on public.blog_posts (category_id);

-- Deliberately RLS-enabled with NO policies — only the service-role API
-- (NestJS) can ever read/write; public reads go through GET /blog and
-- GET /blog/categories, which filter/return only what's meant to be public.
-- Same posture as every other Super-Admin-authored table in this codebase.
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;

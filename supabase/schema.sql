-- TechByDave Dashboard: database setup
-- 1. Change the email on the line marked  <-- YOUR EMAIL  to the one you'll sign in with.
-- 2. Paste this whole file into Supabase -> SQL Editor -> New query, then click Run.
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Who may see the dashboard (only emails listed here, even if someone else signs up)
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;

insert into public.admins (email) values (lower('YOUR-EMAIL@example.com'))   -- <-- YOUR EMAIL
on conflict do nothing;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Metrics: one number per day, per source, per metric
--   website    visits, pageviews            (collected daily from Cloudflare)
--   newsletter subscribers                  (collected daily from Kit)
--   youtube    subscribers, views, videos   (collected daily from YouTube)
--   tiktok / instagram / x / pinterest  followers, views  (weekly check-in in the dashboard)
-- ---------------------------------------------------------------------------
create table if not exists public.metrics (
  day     date    not null,
  source  text    not null check (char_length(source) <= 30),
  metric  text    not null check (char_length(metric) <= 30),
  value   numeric not null,
  updated_at timestamptz not null default now(),
  primary key (day, source, metric)
);
create index if not exists metrics_source_day on public.metrics (source, day);
alter table public.metrics enable row level security;

drop policy if exists "admin metrics" on public.metrics;
create policy "admin metrics" on public.metrics
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Content ideas (the calendar + ideas board)
-- ---------------------------------------------------------------------------
create table if not exists public.ideas (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 160),
  notes       text check (char_length(notes) <= 2000),
  platform    text check (char_length(platform) <= 30),
  status      text not null default 'idea' check (status in ('idea', 'planned', 'filming', 'posted')),
  due         date,
  created_at  timestamptz not null default now()
);
create index if not exists ideas_due on public.ideas (due);
alter table public.ideas enable row level security;

drop policy if exists "admin ideas" on public.ideas;
create policy "admin ideas" on public.ideas
  for all using (public.is_admin()) with check (public.is_admin());

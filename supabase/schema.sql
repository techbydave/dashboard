-- TechByDave Dashboard: database setup
-- Only dave@techbydave.com can see the dashboard's data (see the admins table below).
-- Paste this whole file into Supabase -> SQL Editor -> New query, then click Run.
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Who may see the dashboard (only emails listed here, even if someone else signs up)
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;

insert into public.admins (email) values ('dave@techbydave.com')   -- the only approved account
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

-- ---------------------------------------------------------------------------
-- Google Search Console: top searches and pages for the last ~30 days
-- (daily clicks / impressions / position go in the metrics table as source 'search')
-- ---------------------------------------------------------------------------
create table if not exists public.search_top (
  kind        text not null check (kind in ('query', 'page')),
  item        text not null,
  clicks      numeric not null default 0,
  impressions numeric not null default 0,
  ctr         numeric not null default 0,
  position    numeric not null default 0,
  period_end  date not null,
  primary key (kind, item)
);
alter table public.search_top enable row level security;

drop policy if exists "admin search" on public.search_top;
create policy "admin search" on public.search_top for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Table permissions (row-level security above still limits everything to the admin)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.metrics, public.ideas to authenticated;
grant select on public.admins, public.search_top to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant all on public.metrics, public.ideas, public.admins, public.search_top to service_role;

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

-- Private tokens the collector renews by itself (e.g. Instagram, every week).
-- Row level security is on with no policies, so only the collector's service key can read it.
create table if not exists public.tokens (
  name text primary key,
  value text not null,
  seed text,
  updated_at timestamptz not null default now()
);
alter table public.tokens enable row level security;

-- Backup upload bucket for the Post page (used only if a direct upload to Zernio is blocked).
-- Public reads so the social networks can fetch the file; only dashboard admins can upload or delete.
insert into storage.buckets (id, name, public, file_size_limit)
values ('social-media', 'social-media', true, 52428800)
on conflict (id) do nothing;
create policy "admins upload social media" on storage.objects for insert to authenticated
  with check (bucket_id = 'social-media' and public.is_admin());
create policy "admins delete social media" on storage.objects for delete to authenticated
  using (bucket_id = 'social-media' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Brand deals (the Deals page)
-- ---------------------------------------------------------------------------
create table if not exists public.deals (
  id           uuid primary key default gen_random_uuid(),
  brand        text not null check (char_length(brand) between 1 and 80),
  contact      text check (char_length(contact) <= 120),
  email        text check (char_length(email) <= 160),
  product      text check (char_length(product) <= 160),
  kind         text not null default 'review' check (kind in ('review', 'paid', 'sponsor', 'affiliate', 'other')),
  stage        text not null default 'talking' check (stage in ('talking', 'agreed', 'shipped', 'creating', 'posted', 'paid', 'closed')),
  value        numeric check (value >= 0),
  due          date,
  last_contact date,
  notes        text check (char_length(notes) <= 4000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.deals enable row level security;
drop policy if exists "admin deals" on public.deals;
create policy "admin deals" on public.deals for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Weekly goals (Overview). kind: posts | reviews | subscribers | visits count themselves; manual uses goal_ticks.
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id         uuid primary key default gen_random_uuid(),
  title      text not null check (char_length(title) between 1 and 80),
  kind       text not null default 'manual' check (kind in ('posts', 'reviews', 'subscribers', 'visits', 'manual')),
  target     integer not null default 1 check (target between 1 and 100000),
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.goal_ticks (
  goal_id uuid not null references public.goals (id) on delete cascade,
  week    date not null,
  count   integer not null default 0 check (count between 0 and 100000),
  primary key (goal_id, week)
);
alter table public.goals enable row level security;
alter table public.goal_ticks enable row level security;
drop policy if exists "admin goals" on public.goals;
create policy "admin goals" on public.goals for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin goal ticks" on public.goal_ticks;
create policy "admin goal ticks" on public.goal_ticks for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.deals, public.goals, public.goal_ticks to authenticated;
grant all on public.deals, public.goals, public.goal_ticks to service_role;

-- Starter goals (only if there are none yet)
insert into public.goals (title, kind, target, position)
select * from (values
  ('Publish 3 blog posts', 'posts', 3, 0),
  ('2 hands-on reviews (for AdSense)', 'reviews', 2, 1),
  ('Post 5 Shorts', 'manual', 5, 2),
  ('+10 newsletter subscribers', 'subscribers', 10, 3)
) as v(title, kind, target, position)
where not exists (select 1 from public.goals);

-- The brands you're already talking to (only if the table is empty). Edit stages and dates on the Deals page.
insert into public.deals (brand, contact, product, kind, stage, notes)
select * from (values
  ('Chipolo', null, 'Item trackers', 'review', 'talking', 'You replied that you''d like to review them on your channel.'),
  ('GOBAGS', 'Instagram DM', null, 'review', 'talking', 'Reached out by DM.'),
  ('Bigly Brothers', 'Fred', null, 'review', 'agreed', 'Fred offered a product to review. Send your shipping address if you haven''t yet.'),
  ('ERA', 'Bojan', null, 'paid', 'talking', 'Possible sponsored post: how to wipe and donate old devices.')
) as v(brand, contact, product, kind, stage, notes)
where not exists (select 1 from public.deals);

-- ---------------------------------------------------------------------------
-- Notes (the Notes page)
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  title      text not null default '' check (char_length(title) <= 160),
  body       text not null default '' check (char_length(body) <= 100000),
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.notes enable row level security;
drop policy if exists "admin notes" on public.notes;
create policy "admin notes" on public.notes for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.notes to authenticated;
grant all on public.notes to service_role;

-- ---------------------------------------------------------------------------
-- Learn to code: one row per finished lesson day (Mon-Fri plan in assets/learn-plan.js)
-- ---------------------------------------------------------------------------
create table if not exists public.learn_ticks (
  day     date primary key,
  done_at timestamptz not null default now()
);
alter table public.learn_ticks enable row level security;
drop policy if exists "admin learn" on public.learn_ticks;
create policy "admin learn" on public.learn_ticks for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.learn_ticks to authenticated;
grant all on public.learn_ticks to service_role;

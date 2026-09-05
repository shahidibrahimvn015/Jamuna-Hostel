-- Jamuna Hostel Portal — initial schema + RLS policies

-- =========================================================================
-- Tables
-- =========================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  roll_number text not null,
  role text not null default 'viewer' check (role in ('admin','resident','viewer')),
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_roll_number_idx on profiles(roll_number);

create table residents (
  id bigint generated always as identity primary key,
  roll_number text unique not null,
  added_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table pantry_room (
  id bigint generated always as identity primary key,
  label text not null,
  location text,
  status text not null default 'free' check (status in ('free','occupied')),
  occupied_by uuid references profiles(id),
  occupied_by_roll_number text,
  started_at timestamptz,
  end_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hostel_reps (
  id bigint generated always as identity primary key,
  section text not null check (section in ('office','council')),
  name text not null,
  role_title text,
  phone text,
  email text,
  photo_path text,
  extra jsonb,
  sort_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table wifi_troubleshooting_blocks (
  id bigint generated always as identity primary key,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table wifi_troubleshooting_tips (
  id bigint generated always as identity primary key,
  block_id bigint not null references wifi_troubleshooting_blocks(id) on delete cascade,
  tip text not null,
  sort_order int default 0
);

create table wifi_tickets (
  id bigint generated always as identity primary key,
  raised_by uuid references profiles(id) not null,
  smail_id text not null,
  room_number text not null,
  contact_number text,
  mac_address text,
  issue_description text not null,
  mail_sent boolean not null,
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now()
);

create table first_aid_info (
  id int primary key default 1 check (id = 1),
  contents text,
  guidelines text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create table emergency_contacts (
  id bigint generated always as identity primary key,
  name text not null,
  role_title text,
  phone text not null,
  extra jsonb,
  sort_order int default 0
);

create table secretary_portfolios (
  id bigint generated always as identity primary key,
  name text unique not null
);

create table budget_items (
  id bigint generated always as identity primary key,
  portfolio_id bigint references secretary_portfolios(id) on delete cascade,
  item text not null,
  budget numeric(10,2) not null default 0,
  spent numeric(10,2) not null default 0,
  balance numeric(10,2) generated always as (budget - spent) stored,
  bill_path text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hostel_settings (
  id int primary key default 1 check (id = 1),
  per_head_amount numeric(10,2) not null default 1500,
  total_resident_count_override int
);

create table notices (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null,
  event_date date not null,
  poster_path text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed singleton rows so the app can always upsert/select id=1 safely.
insert into first_aid_info (id) values (1);
insert into hostel_settings (id) values (1);
insert into pantry_room (label, location) values ('Pantry Room', 'Ground Floor');

-- =========================================================================
-- Helper functions
-- =========================================================================

create or replace function public.current_user_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable as $$ select current_user_role() = 'admin' $$;

create or replace function public.is_resident_or_admin() returns boolean
language sql stable as $$ select current_user_role() in ('admin','resident') $$;

-- =========================================================================
-- RLS: profiles (special case — role is never client-writable)
-- =========================================================================

alter table profiles enable row level security;

create policy "select own or admin" on profiles
  for select using (auth.uid() = id or is_admin());

create policy "update own full_name only" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);
-- NOTE: enforce in application code (or a trigger) that only full_name
-- changes via this policy; role/email/roll_number are written exclusively
-- by the service-role upsert in the auth callback.

-- =========================================================================
-- RLS: residents (admin-managed allowlist)
-- =========================================================================

alter table residents enable row level security;

create policy "read all authenticated" on residents
  for select using (auth.role() = 'authenticated');

create policy "admin writes" on residents
  for all using (is_admin()) with check (is_admin());

-- =========================================================================
-- RLS: pantry_room (view = all, occupy/release = resident or admin)
-- =========================================================================

alter table pantry_room enable row level security;

create policy "read all authenticated" on pantry_room
  for select using (auth.role() = 'authenticated');

create policy "resident/admin occupies or releases" on pantry_room
  for update using (is_resident_or_admin()) with check (is_resident_or_admin());

create policy "admin manages pantry rows" on pantry_room
  for insert with check (is_admin());

create policy "admin deletes pantry rows" on pantry_room
  for delete using (is_admin());

-- Required for the client's Realtime subscription (postgres_changes) to
-- receive occupy/release updates as they happen.
alter publication supabase_realtime add table pantry_room;

-- =========================================================================
-- RLS: admin-editable content tables (reusable pattern)
-- =========================================================================

alter table hostel_reps enable row level security;
create policy "read all authenticated" on hostel_reps for select using (auth.role() = 'authenticated');
create policy "admin writes" on hostel_reps for all using (is_admin()) with check (is_admin());

alter table wifi_troubleshooting_blocks enable row level security;
create policy "read all authenticated" on wifi_troubleshooting_blocks for select using (auth.role() = 'authenticated');
create policy "admin writes" on wifi_troubleshooting_blocks for all using (is_admin()) with check (is_admin());

alter table wifi_troubleshooting_tips enable row level security;
create policy "read all authenticated" on wifi_troubleshooting_tips for select using (auth.role() = 'authenticated');
create policy "admin writes" on wifi_troubleshooting_tips for all using (is_admin()) with check (is_admin());

alter table first_aid_info enable row level security;
create policy "read all authenticated" on first_aid_info for select using (auth.role() = 'authenticated');
create policy "admin writes" on first_aid_info for all using (is_admin()) with check (is_admin());

alter table emergency_contacts enable row level security;
create policy "read all authenticated" on emergency_contacts for select using (auth.role() = 'authenticated');
create policy "admin writes" on emergency_contacts for all using (is_admin()) with check (is_admin());

alter table secretary_portfolios enable row level security;
create policy "read all authenticated" on secretary_portfolios for select using (auth.role() = 'authenticated');
create policy "admin writes" on secretary_portfolios for all using (is_admin()) with check (is_admin());

alter table budget_items enable row level security;
create policy "read all authenticated" on budget_items for select using (auth.role() = 'authenticated');
create policy "admin writes" on budget_items for all using (is_admin()) with check (is_admin());

alter table hostel_settings enable row level security;
create policy "read all authenticated" on hostel_settings for select using (auth.role() = 'authenticated');
create policy "admin writes" on hostel_settings for all using (is_admin()) with check (is_admin());

alter table notices enable row level security;
create policy "read all authenticated" on notices for select using (auth.role() = 'authenticated');
create policy "admin writes" on notices for all using (is_admin()) with check (is_admin());

-- =========================================================================
-- RLS: wifi_tickets (own-row visibility)
-- =========================================================================

alter table wifi_tickets enable row level security;

create policy "insert own ticket" on wifi_tickets
  for insert with check (auth.uid() = raised_by);

create policy "select own or admin" on wifi_tickets
  for select using (auth.uid() = raised_by or is_admin());

create policy "admin updates status" on wifi_tickets
  for update using (is_admin());

create policy "delete own or admin" on wifi_tickets
  for delete using (auth.uid() = raised_by or is_admin());

-- =========================================================================
-- Storage buckets + policies
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('bills', 'bills', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('notice-posters', 'notice-posters', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('rep-photos', 'rep-photos', true)
on conflict (id) do nothing;

create policy "admin write bills" on storage.objects
  for insert with check (bucket_id = 'bills' and is_admin());
create policy "admin manage bills" on storage.objects
  for all using (bucket_id = 'bills' and is_admin()) with check (bucket_id = 'bills' and is_admin());
create policy "authenticated read bills" on storage.objects
  for select using (bucket_id = 'bills' and auth.role() = 'authenticated');

create policy "admin write notice posters" on storage.objects
  for all using (bucket_id = 'notice-posters' and is_admin())
  with check (bucket_id = 'notice-posters' and is_admin());
create policy "public read notice posters" on storage.objects
  for select using (bucket_id = 'notice-posters');

create policy "admin write rep photos" on storage.objects
  for all using (bucket_id = 'rep-photos' and is_admin())
  with check (bucket_id = 'rep-photos' and is_admin());
create policy "public read rep photos" on storage.objects
  for select using (bucket_id = 'rep-photos');

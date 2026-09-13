-- Remove Floor Layout entirely (table, storage objects, bucket, policies)
-- and replace it with a Notice Board: admin-posted events visible to all.
--
-- NOTE: Supabase blocks direct DELETE on storage.objects/storage.buckets
-- (a protect_delete trigger raises 42501). Before running this migration,
-- delete the 'floor-layouts' bucket from the Dashboard instead:
-- Storage -> floor-layouts -> "..." menu -> Delete bucket (this removes
-- its objects too). Then run the rest of this file.
--
-- 0001_init.sql now ships the post-migration schema (no floor_layouts, notices
-- already present), so the statements below are guarded to keep a from-scratch
-- replay working. "drop policy if exists ... on floor_layouts" tolerates a
-- missing policy but NOT a missing table, so it needs the to_regclass check.

drop policy if exists "admin write floor layouts" on storage.objects;
drop policy if exists "public read floor layouts" on storage.objects;

do $$
begin
  if to_regclass('public.floor_layouts') is not null then
    drop policy if exists "read all authenticated" on floor_layouts;
    drop policy if exists "admin writes" on floor_layouts;
  end if;
end $$;

drop table if exists floor_layouts;

create table if not exists notices (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null,
  event_date date not null,
  poster_path text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notices enable row level security;

drop policy if exists "read all authenticated" on notices;
create policy "read all authenticated" on notices
  for select using (auth.role() = 'authenticated');

drop policy if exists "admin writes" on notices;
create policy "admin writes" on notices
  for all using (is_admin()) with check (is_admin());

insert into storage.buckets (id, name, public)
values ('notice-posters', 'notice-posters', true)
on conflict (id) do nothing;

drop policy if exists "admin write notice posters" on storage.objects;
create policy "admin write notice posters" on storage.objects
  for all using (bucket_id = 'notice-posters' and is_admin())
  with check (bucket_id = 'notice-posters' and is_admin());

drop policy if exists "public read notice posters" on storage.objects;
create policy "public read notice posters" on storage.objects
  for select using (bucket_id = 'notice-posters');

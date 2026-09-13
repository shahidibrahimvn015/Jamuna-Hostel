-- Group troubleshooting tips into admin-defined blocks (title + tips),
-- instead of one flat list.
--
-- 0001_init.sql now ships the post-migration shape of both tables, so every
-- create/add below is guarded; without the guards a from-scratch replay died on
--   ERROR: relation "wifi_troubleshooting_blocks" already exists

create table if not exists wifi_troubleshooting_blocks (
  id bigint generated always as identity primary key,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table wifi_troubleshooting_tips
  add column if not exists block_id bigint
  references wifi_troubleshooting_blocks(id) on delete cascade;

-- Move any existing tips into a default block so the column can become NOT NULL.
insert into wifi_troubleshooting_blocks (title, sort_order)
select 'General', 0
where exists (select 1 from wifi_troubleshooting_tips where block_id is null);

update wifi_troubleshooting_tips
set block_id = (select id from wifi_troubleshooting_blocks where title = 'General' order by id limit 1)
where block_id is null;

alter table wifi_troubleshooting_tips alter column block_id set not null;

alter table wifi_troubleshooting_blocks enable row level security;

drop policy if exists "read all authenticated" on wifi_troubleshooting_blocks;
create policy "read all authenticated" on wifi_troubleshooting_blocks
  for select using (auth.role() = 'authenticated');

drop policy if exists "admin writes" on wifi_troubleshooting_blocks;
create policy "admin writes" on wifi_troubleshooting_blocks
  for all using (is_admin()) with check (is_admin());

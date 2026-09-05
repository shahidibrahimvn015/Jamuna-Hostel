-- Group troubleshooting tips into admin-defined blocks (title + tips),
-- instead of one flat list.

create table wifi_troubleshooting_blocks (
  id bigint generated always as identity primary key,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table wifi_troubleshooting_tips
  add column block_id bigint references wifi_troubleshooting_blocks(id) on delete cascade;

-- Move any existing tips into a default block so the column can become NOT NULL.
insert into wifi_troubleshooting_blocks (title, sort_order)
select 'General', 0
where exists (select 1 from wifi_troubleshooting_tips where block_id is null);

update wifi_troubleshooting_tips
set block_id = (select id from wifi_troubleshooting_blocks where title = 'General' order by id limit 1)
where block_id is null;

alter table wifi_troubleshooting_tips alter column block_id set not null;

alter table wifi_troubleshooting_blocks enable row level security;
create policy "read all authenticated" on wifi_troubleshooting_blocks
  for select using (auth.role() = 'authenticated');
create policy "admin writes" on wifi_troubleshooting_blocks
  for all using (is_admin()) with check (is_admin());

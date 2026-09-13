-- Council members can have an optional photo.
--
-- 0001_init.sql now ships photo_path and both storage policies, so the policy
-- creates are drop-guarded to keep a from-scratch replay working.
alter table hostel_reps add column if not exists photo_path text;

insert into storage.buckets (id, name, public)
values ('rep-photos', 'rep-photos', true)
on conflict (id) do nothing;

drop policy if exists "admin write rep photos" on storage.objects;
create policy "admin write rep photos" on storage.objects
  for all using (bucket_id = 'rep-photos' and is_admin())
  with check (bucket_id = 'rep-photos' and is_admin());

drop policy if exists "public read rep photos" on storage.objects;
create policy "public read rep photos" on storage.objects
  for select using (bucket_id = 'rep-photos');

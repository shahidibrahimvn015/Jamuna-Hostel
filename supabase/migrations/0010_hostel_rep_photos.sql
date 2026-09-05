-- Council members can have an optional photo.
alter table hostel_reps add column if not exists photo_path text;

insert into storage.buckets (id, name, public)
values ('rep-photos', 'rep-photos', true)
on conflict (id) do nothing;

create policy "admin write rep photos" on storage.objects
  for all using (bucket_id = 'rep-photos' and is_admin())
  with check (bucket_id = 'rep-photos' and is_admin());
create policy "public read rep photos" on storage.objects
  for select using (bucket_id = 'rep-photos');

-- Hostel Facilities (pantry room + washing machines) is for residents and
-- admins only.
--
-- 0001 and 0015 let every signed-in account read these tables. That included
-- viewers (smail accounts that are not on the residents list), and each of
-- these tables carries the roll number of whoever is using the facility right
-- now. Reading now needs is_resident_or_admin(). Realtime applies the same
-- rule, so a viewer's subscription receives nothing either.
--
-- Write policies and the guard triggers (0013, 0015) are unchanged. Residents
-- and admins still pass the new read rule, which UPDATE statements that filter
-- on columns also need, and which the washing-slot guard needs when it looks up
-- the machine's status as the caller.

drop policy if exists "read all authenticated" on pantry_room;
drop policy if exists "residents and admins read" on pantry_room;
create policy "residents and admins read" on pantry_room
  for select using (is_resident_or_admin());

drop policy if exists "read all authenticated" on washing_machines;
drop policy if exists "residents and admins read" on washing_machines;
create policy "residents and admins read" on washing_machines
  for select using (is_resident_or_admin());

drop policy if exists "read all authenticated" on washing_machine_slots;
drop policy if exists "residents and admins read" on washing_machine_slots;
create policy "residents and admins read" on washing_machine_slots
  for select using (is_resident_or_admin());

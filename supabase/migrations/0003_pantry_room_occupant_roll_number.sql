-- Denormalized so everyone (not just admins) can see who currently holds the
-- pantry room without needing broader read access to the profiles table.
alter table pantry_room add column if not exists occupied_by_roll_number text;

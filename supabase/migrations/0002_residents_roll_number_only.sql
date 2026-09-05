-- Residents only ever needed the roll number; drop the unused columns.
alter table residents drop column if exists full_name;
alter table residents drop column if exists room_number;

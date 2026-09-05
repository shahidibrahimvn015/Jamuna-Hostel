-- The Warden no longer gets a separate section — fold any existing warden
-- entries into Hostel Office (their role_title still says "Warden").
update hostel_reps set section = 'office' where section = 'warden';

alter table hostel_reps drop constraint if exists hostel_reps_section_check;
alter table hostel_reps add constraint hostel_reps_section_check
  check (section in ('office','council'));

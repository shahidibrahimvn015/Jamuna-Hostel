-- Without this, the client's Realtime subscription never fires: occupy/release
-- only shows up for other viewers on their next reload instead of live.
--
-- 0001_init.sql now also adds pantry_room to this publication, so a bare
-- "alter publication ... add table" aborted a from-scratch replay with
--   ERROR: relation "pantry_room" is already member of publication "supabase_realtime"
-- Swallowing the duplicate keeps the migration set replayable on a clean database.
do $$
begin
  alter publication supabase_realtime add table pantry_room;
exception
  when duplicate_object then null;
end $$;

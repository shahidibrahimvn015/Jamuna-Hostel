-- Without this, the client's Realtime subscription never fires: occupy/release
-- only shows up for other viewers on their next reload instead of live.
alter publication supabase_realtime add table pantry_room;

-- Allow the ticket's own raiser, or an admin, to delete a wifi ticket.
--
-- 0001_init.sql now creates a policy of this same name on wifi_tickets, so a
-- bare "create policy" here aborted a from-scratch replay with
--   ERROR: policy "delete own or admin" for table "wifi_tickets" already exists
-- and every later migration never ran. Dropping first makes this migration
-- idempotent and keeps the set replayable on a clean database.
drop policy if exists "delete own or admin" on wifi_tickets;

create policy "delete own or admin" on wifi_tickets
  for delete using (auth.uid() = raised_by or is_admin());

-- Restrict raising a WiFi ticket to residents and admins.
--
-- "insert own ticket" in 0001_init.sql only checked auth.uid() = raised_by, so
-- any authenticated smail address -- including a viewer who has no connection
-- to the hostel -- could file complaints, and could do so straight against
-- PostgREST without the form. The form is now hidden for viewers and logTicket
-- checks the role, but neither of those is enforcement on its own.
--
-- Ticket SELECT/UPDATE/DELETE policies are unchanged: someone who was a
-- resident when they filed a ticket keeps access to it after their role
-- changes.

drop policy if exists "insert own ticket" on wifi_tickets;

create policy "insert own ticket" on wifi_tickets
  for insert with check (auth.uid() = raised_by and is_resident_or_admin());

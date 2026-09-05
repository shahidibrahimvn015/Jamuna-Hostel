-- Allow the ticket's own raiser, or an admin, to delete a wifi ticket.
create policy "delete own or admin" on wifi_tickets
  for delete using (auth.uid() = raised_by or is_admin());

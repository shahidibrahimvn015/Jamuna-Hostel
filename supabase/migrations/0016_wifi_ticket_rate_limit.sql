-- Rate-limit WiFi ticket creation: 5 per hour per resident.
--
-- Tickets are already restricted to residents (0014) and every row carries a
-- roll number, so this is about accidents and annoyance rather than anonymous
-- abuse -- a double-submit, a stuck retry loop, or one frustrated student
-- filing the same complaint twenty times. A cap in the server action alone
-- would not hold, since POST /rest/v1/wifi_tickets is reachable directly.
--
-- Admins are exempt: they may need to file on someone's behalf in bulk.

create or replace function public.guard_wifi_ticket_rate()
returns trigger
language plpgsql
-- Must stay SECURITY INVOKER: the current_user check below depends on it, and
-- the count must run under the caller's RLS (they can read their own tickets).
set search_path = public
as $$
declare
  recent_count int;
begin
  if current_user in ('service_role', 'supabase_admin', 'postgres') then
    return new;
  end if;

  if is_admin() then
    return new;
  end if;

  select count(*) into recent_count
    from wifi_tickets
   where raised_by = new.raised_by
     and created_at > now() - interval '1 hour';

  if recent_count >= 5 then
    raise exception
      'Too many WiFi tickets raised in the last hour. Please wait before raising another.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists wifi_tickets_rate_limit on wifi_tickets;

create trigger wifi_tickets_rate_limit
  before insert on wifi_tickets
  for each row
  execute function public.guard_wifi_ticket_rate();

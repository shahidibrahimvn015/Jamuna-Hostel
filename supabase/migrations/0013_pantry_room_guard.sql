-- Enforce the pantry room's rules in the database, not just in actions.ts.
--
-- The RLS policy is "resident/admin occupies or releases" USING
-- is_resident_or_admin() -- it checks WHO you are, never WHAT you are writing.
-- Since the anon key ships in the browser bundle and every resident holds a
-- real JWT, a resident can PATCH /rest/v1/pantry_room directly and bypass
-- occupyPantryRoom entirely: set end_time to 2030 (the 60-minute cap lives only
-- in TypeScript), reassign occupied_by to another student, or clear someone
-- else's active booking.
--
-- Same situation the profiles trigger fixed in 0011: app-level rules are not
-- rules until the database enforces them.

create or replace function public.guard_pantry_room_update()
returns trigger
language plpgsql
-- Must stay SECURITY INVOKER: the current_user check below depends on it.
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  expected_roll text;
begin
  -- Migrations, the dashboard SQL editor and the service-role key pass through.
  -- Checked before is_admin() because auth.uid() is null for those callers.
  if current_user in ('service_role', 'supabase_admin', 'postgres') then
    return new;
  end if;

  if is_admin() then
    return new;
  end if;

  -- label/location/id are configuration, not occupancy state.
  if new.id       is distinct from old.id
  or new.label    is distinct from old.label
  or new.location is distinct from old.location then
    raise exception 'pantry room configuration is admin-only'
      using errcode = 'insufficient_privilege';
  end if;

  if new.status = 'occupied' then
    -- Taking a room somebody else still holds. An expired booking stays marked
    -- 'occupied' until something reconciles it, so only an unexpired one blocks.
    if old.status = 'occupied'
       and old.end_time is not null
       and old.end_time > now()
       and old.occupied_by is distinct from actor then
      raise exception 'the pantry room is currently occupied by someone else'
        using errcode = 'insufficient_privilege';
    end if;

    if new.occupied_by is distinct from actor then
      raise exception 'you can only occupy the pantry room for yourself'
        using errcode = 'insufficient_privilege';
    end if;

    -- Don't let the displayed roll number claim to be another student.
    select roll_number into expected_roll from profiles where id = actor;
    if expected_roll is not null
       and new.occupied_by_roll_number is distinct from expected_roll then
      raise exception 'occupied_by_roll_number must be your own roll number'
        using errcode = 'insufficient_privilege';
    end if;

    if new.end_time is null then
      raise exception 'occupying the pantry room requires an end_time'
        using errcode = 'check_violation';
    end if;

    -- The real cap: the room cannot be held more than an hour from now.
    -- Compared against now() rather than new.started_at so that backdating
    -- started_at cannot buy extra time. The ceiling is 65 minutes, not 60, to
    -- absorb clock skew between the app server that computes end_time and this
    -- database -- it still bounds abuse, which is the point.
    if new.end_time > now() + interval '65 minutes' then
      raise exception 'the pantry room can be booked for at most 60 minutes'
        using errcode = 'check_violation';
    end if;

  elsif new.status = 'free' then
    -- Releasing. Your own booking is always fine; anyone's expired booking is
    -- fine too, because PantryStatusCard's handleExpire() fires the release
    -- from whichever viewer's countdown hits zero first, usually a bystander.
    -- Without that allowance, auto-free breaks and rows go stale.
    if old.status = 'occupied'
       and old.occupied_by is distinct from actor
       and (old.end_time is null or old.end_time > now()) then
      raise exception 'only the current occupant or an admin can release the room'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists pantry_room_guard_update on pantry_room;

create trigger pantry_room_guard_update
  before update on pantry_room
  for each row
  execute function public.guard_pantry_room_update();

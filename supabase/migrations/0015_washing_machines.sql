-- Washing machines for the Hostel Facilities page.
--
-- Occupancy lives in a child table rather than on the machine itself because a
-- semi-automatic has two independently bookable parts with different limits
-- (washer 60 min, dryer 30 min), while an automatic has one (wash, 90 min).
-- One row per bookable slot keeps the occupancy logic identical for both, and
-- the per-slot cap is stored as data rather than hardcoded in the app.

create table if not exists washing_machines (
  id bigint generated always as identity primary key,
  machine_code text not null,
  floor text not null check (floor in ('ground', '1st', '2nd', '3rd')),
  model text not null check (model in ('automatic', 'semi_automatic')),
  status text not null default 'working' check (status in ('working', 'maintenance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists washing_machines_code_key
  on washing_machines (lower(machine_code));

create table if not exists washing_machine_slots (
  id bigint generated always as identity primary key,
  machine_id bigint not null references washing_machines(id) on delete cascade,
  slot text not null check (slot in ('wash', 'washer', 'dryer')),
  max_minutes int not null check (max_minutes > 0),
  status text not null default 'free' check (status in ('free', 'occupied')),
  occupied_by uuid references profiles(id),
  occupied_by_roll_number text,
  started_at timestamptz,
  end_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (machine_id, slot)
);

create index if not exists washing_machine_slots_machine_idx
  on washing_machine_slots (machine_id);

-- =========================================================================
-- Slots are derived from the model, never managed by hand
-- =========================================================================

create or replace function public.sync_washing_machine_slots()
returns trigger
language plpgsql
-- SECURITY DEFINER so slot rows are created regardless of the caller's RLS.
-- Safe here (unlike the guard triggers) because this function makes no
-- authorization decision based on current_user.
security definer
set search_path = public
as $$
begin
  if new.model = 'automatic' then
    delete from washing_machine_slots
     where machine_id = new.id and slot <> 'wash';

    insert into washing_machine_slots (machine_id, slot, max_minutes)
    values (new.id, 'wash', 90)
    on conflict (machine_id, slot) do update set max_minutes = excluded.max_minutes;
  else
    delete from washing_machine_slots
     where machine_id = new.id and slot not in ('washer', 'dryer');

    insert into washing_machine_slots (machine_id, slot, max_minutes)
    values (new.id, 'washer', 60), (new.id, 'dryer', 30)
    on conflict (machine_id, slot) do update set max_minutes = excluded.max_minutes;
  end if;

  return null;
end;
$$;

drop trigger if exists washing_machines_sync_slots on washing_machines;

create trigger washing_machines_sync_slots
  after insert or update of model on washing_machines
  for each row
  execute function public.sync_washing_machine_slots();

-- Sending a machine for maintenance clears whoever is on it: the machine is
-- out of service, so leaving a live countdown on its slots would be a lie.
create or replace function public.free_slots_on_maintenance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'maintenance' and old.status is distinct from 'maintenance' then
    update washing_machine_slots
       set status = 'free',
           occupied_by = null,
           occupied_by_roll_number = null,
           started_at = null,
           end_time = null,
           updated_at = now()
     where machine_id = new.id
       and status <> 'free';
  end if;

  return null;
end;
$$;

drop trigger if exists washing_machines_free_on_maintenance on washing_machines;

create trigger washing_machines_free_on_maintenance
  after update of status on washing_machines
  for each row
  execute function public.free_slots_on_maintenance();

-- =========================================================================
-- Occupancy guard -- the same shape as pantry_room's in 0013
-- =========================================================================

create or replace function public.guard_washing_machine_slot_update()
returns trigger
language plpgsql
-- Must stay SECURITY INVOKER: the current_user check below depends on it.
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  expected_roll text;
  machine_state text;
begin
  if current_user in ('service_role', 'supabase_admin', 'postgres') then
    return new;
  end if;

  if is_admin() then
    return new;
  end if;

  -- Which slot this is, and how long it may be held, is configuration.
  if new.id          is distinct from old.id
  or new.machine_id  is distinct from old.machine_id
  or new.slot        is distinct from old.slot
  or new.max_minutes is distinct from old.max_minutes then
    raise exception 'washing machine configuration is admin-only'
      using errcode = 'insufficient_privilege';
  end if;

  if new.status = 'occupied' then
    select status into machine_state
      from washing_machines where id = new.machine_id;

    if machine_state is distinct from 'working' then
      raise exception 'this washing machine is under maintenance'
        using errcode = 'insufficient_privilege';
    end if;

    -- An expired booking lingers as 'occupied' until something reconciles it,
    -- so only an unexpired one blocks a new booking.
    if old.status = 'occupied'
       and old.end_time is not null
       and old.end_time > now()
       and old.occupied_by is distinct from actor then
      raise exception 'this washing machine slot is already in use'
        using errcode = 'insufficient_privilege';
    end if;

    if new.occupied_by is distinct from actor then
      raise exception 'you can only occupy a washing machine for yourself'
        using errcode = 'insufficient_privilege';
    end if;

    select roll_number into expected_roll from profiles where id = actor;
    if expected_roll is not null
       and new.occupied_by_roll_number is distinct from expected_roll then
      raise exception 'occupied_by_roll_number must be your own roll number'
        using errcode = 'insufficient_privilege';
    end if;

    if new.end_time is null then
      raise exception 'occupying a washing machine requires an end_time'
        using errcode = 'check_violation';
    end if;

    -- The per-slot cap, read from the row rather than hardcoded. Measured from
    -- now() so backdating started_at buys nothing, with 5 minutes of slack for
    -- clock skew between the app server and this database.
    if new.end_time > now() + make_interval(mins => old.max_minutes + 5) then
      raise exception 'this slot can be booked for at most % minutes', old.max_minutes
        using errcode = 'check_violation';
    end if;

  elsif new.status = 'free' then
    -- Own booking, or anyone's expired one -- the expired case is what lets a
    -- bystander's countdown reconcile the row, as on the pantry room.
    if old.status = 'occupied'
       and old.occupied_by is distinct from actor
       and (old.end_time is null or old.end_time > now()) then
      raise exception 'only the current user or an admin can release this slot'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists washing_machine_slots_guard_update on washing_machine_slots;

create trigger washing_machine_slots_guard_update
  before update on washing_machine_slots
  for each row
  execute function public.guard_washing_machine_slot_update();

-- =========================================================================
-- RLS
-- =========================================================================

alter table washing_machines enable row level security;

drop policy if exists "read all authenticated" on washing_machines;
create policy "read all authenticated" on washing_machines
  for select using (auth.role() = 'authenticated');

drop policy if exists "admin writes" on washing_machines;
create policy "admin writes" on washing_machines
  for all using (is_admin()) with check (is_admin());

alter table washing_machine_slots enable row level security;

drop policy if exists "read all authenticated" on washing_machine_slots;
create policy "read all authenticated" on washing_machine_slots
  for select using (auth.role() = 'authenticated');

drop policy if exists "resident/admin occupies or releases" on washing_machine_slots;
create policy "resident/admin occupies or releases" on washing_machine_slots
  for update using (is_resident_or_admin()) with check (is_resident_or_admin());

drop policy if exists "admin manages slots" on washing_machine_slots;
create policy "admin manages slots" on washing_machine_slots
  for insert with check (is_admin());

drop policy if exists "admin deletes slots" on washing_machine_slots;
create policy "admin deletes slots" on washing_machine_slots
  for delete using (is_admin());

-- Live occupancy updates, as for pantry_room.
do $$
begin
  alter publication supabase_realtime add table washing_machine_slots;
exception
  when duplicate_object then null;
end $$;

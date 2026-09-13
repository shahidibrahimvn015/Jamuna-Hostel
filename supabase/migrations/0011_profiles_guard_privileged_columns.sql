-- Close the profiles privilege-escalation hole.
--
-- The "update own full_name only" policy in 0001_init.sql only checked
-- auth.uid() = id, so any signed-in user could talk to Supabase directly and
-- run:
--     update profiles set role = 'admin' where id = '<their own id>';
-- RLS would allow it, granting them admin across the whole portal. That
-- policy's own comment said the column restriction was "enforced in
-- application code" -- but no client-facing code updates profiles at all, so
-- nothing was enforcing it.
--
-- id / email / roll_number / role are written exclusively by the service-role
-- upsert in the auth callback (lib/auth/resolveRole.ts). This trigger makes
-- that a database-level guarantee that holds no matter which RLS policies
-- exist now or get added later.

create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
-- IMPORTANT: this must stay SECURITY INVOKER (the default). Under SECURITY
-- DEFINER, current_user would become the function owner ('postgres') for every
-- caller, the check below would always pass, and the guard would silently do
-- nothing. Do not "harden" this by adding security definer.
set search_path = public
as $$
begin
  -- PostgREST switches the Postgres role from the JWT "role" claim, so
  -- current_user is 'service_role' for the service-role key, 'authenticated'
  -- or 'anon' for end users, and 'postgres'/'supabase_admin' for migrations
  -- and the dashboard SQL editor.
  if current_user in ('service_role', 'supabase_admin', 'postgres') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Nothing can insert profiles today (there is no INSERT policy), but if
    -- one is ever added, a self-created row must not get to pick its own role.
    new.role := 'viewer';
    return new;
  end if;

  if new.id          is distinct from old.id
  or new.email       is distinct from old.email
  or new.roll_number is distinct from old.roll_number
  or new.role        is distinct from old.role
  or new.created_at  is distinct from old.created_at then
    raise exception
      'profiles.id, email, roll_number, role and created_at are not client-writable'
      using errcode = 'insufficient_privilege';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_columns on profiles;

create trigger profiles_guard_privileged_columns
  before insert or update on profiles
  for each row
  execute function public.guard_profile_privileged_columns();

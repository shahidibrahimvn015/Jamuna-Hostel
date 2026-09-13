-- Pin search_path on the two role-check helpers.
--
-- Supabase's Security Advisor flags both as "Function Search Path Mutable".
-- current_user_role() right beside them in 0001_init.sql already pins it; these
-- two were just missed. They gate every admin write in the database via
-- is_admin(), so a caller able to influence search_path could otherwise shadow
-- current_user_role() and make is_admin() return true.
--
-- create or replace keeps existing grants and the policies that depend on these
-- functions, so nothing needs re-creating.

create or replace function public.is_admin() returns boolean
language sql stable
set search_path = public
as $$ select current_user_role() = 'admin' $$;

create or replace function public.is_resident_or_admin() returns boolean
language sql stable
set search_path = public
as $$ select current_user_role() in ('admin','resident') $$;

-- Three gaps flagged by the Supabase Security Advisor and a review of who can
-- obtain a session at all.
--
-- 1. Only smail accounts can be created.
--    The @smail.iitm.ac.in check lived solely in the app's /auth/callback
--    route. Supabase Auth itself accepts ANY Google account (the `hd` hint on
--    the login button is only a UI nudge), and the public anon key lets anyone
--    call it directly without going through this app. A session obtained that
--    way is the `authenticated` role, and every "read all authenticated"
--    policy would have answered it. Refusing the account at creation, inside
--    Auth, closes that no matter which route is used. Anonymous sign-ins have
--    no email, so they are refused too.
--
-- 2. Public photo buckets stop being listable.
--    notice-posters and rep-photos are public buckets, so images load from
--    /storage/v1/object/public/... with no policy at all. The broad SELECT
--    policies only added the ability to LIST every file in the bucket.
--    Admin access is unaffected: the "for all" admin policies still cover it.
--
-- 3. Trigger-only SECURITY DEFINER functions are no longer callable over
--    /rest/v1/rpc. Postgres checks EXECUTE when a trigger is created, not each
--    time it fires, so the triggers keep working.
--
-- current_user_role() is deliberately left alone: it is SECURITY DEFINER so
-- policies can read profiles without recursing, it only ever returns the
-- caller's own role, and is_admin()/is_resident_or_admin() run as the caller
-- and need EXECUTE on it. Revoking it would break every admin policy.

-- ---------------------------------------------------------------------------
-- 1. Reject non-smail sign-ups
-- ---------------------------------------------------------------------------

create or replace function public.reject_non_smail_signup()
returns trigger
language plpgsql
-- Must stay SECURITY INVOKER; it makes no authorization decision from the
-- caller's identity, it only inspects the row being inserted.
set search_path = ''
as $$
begin
  -- Domain only. Role accounts such as jamuna.legislator@ have dots in the
  -- local part and are legitimate smail accounts; whether an account may use
  -- the portal (needs a roll number) is the app callback's decision, not this
  -- trigger's. Its job is just to keep non-smail identities out of Auth.
  if new.email is null
     or new.email !~* '^[^@]+@smail[.]iitm[.]ac[.]in$' then
    raise exception 'Only @smail.iitm.ac.in accounts may sign up'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists reject_non_smail_signup on auth.users;

create trigger reject_non_smail_signup
  before insert on auth.users
  for each row
  execute function public.reject_non_smail_signup();

-- ---------------------------------------------------------------------------
-- 2. Stop the public photo buckets being listable
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1 from storage.buckets
    where id in ('notice-posters', 'rep-photos') and public is not true
  ) then
    raise exception
      'notice-posters and rep-photos must be public buckets before their read policies are dropped, or every image would break';
  end if;
end $$;

drop policy if exists "public read notice posters" on storage.objects;
drop policy if exists "public read rep photos" on storage.objects;

-- ---------------------------------------------------------------------------
-- 3. Trigger-only definer functions are not RPC endpoints
-- ---------------------------------------------------------------------------

revoke execute on function public.sync_washing_machine_slots()
  from public, anon, authenticated;
revoke execute on function public.free_slots_on_maintenance()
  from public, anon, authenticated;

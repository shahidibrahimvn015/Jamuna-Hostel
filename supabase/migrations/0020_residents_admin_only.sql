-- The residents table (the roll-number allowlist) becomes readable by admins
-- only.
--
-- 0001 let every signed-in account read it ("read all authenticated"). That
-- handed the full hostel roster to any resident, and to anyone who held a
-- session, for no reason: the app never needed a non-admin to read it.
-- Role resolution reads it with the service-role client, which bypasses RLS,
-- and the budget page now gets its head-count from lib/residentCount.ts the
-- same way.
--
-- The remaining "admin writes" policy is "for all", so admins keep full
-- read/write. With no policy matching them, everyone else sees zero rows and
-- can write none.

drop policy if exists "read all authenticated" on residents;

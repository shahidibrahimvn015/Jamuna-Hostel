import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminEmails, type Role } from "@/lib/auth/roles";

export async function resolveRole(
  email: string,
  rollNumber: string
): Promise<Role> {
  if (getAdminEmails().includes(email.toLowerCase())) {
    return "admin";
  }

  const supabaseAdmin = createAdminClient();
  const { data } = await supabaseAdmin
    .from("residents")
    .select("roll_number")
    .eq("roll_number", rollNumber)
    .maybeSingle();

  return data ? "resident" : "viewer";
}

/**
 * Recomputes role and upserts the profile row. Called on every login (not
 * just first login) because admins can add/remove residents, or ADMIN_EMAILS
 * can change on redeploy, at any time.
 */
export async function upsertProfileWithResolvedRole(user: {
  id: string;
  email: string;
  rollNumber: string;
}) {
  const role = await resolveRole(user.email, user.rollNumber);
  const supabaseAdmin = createAdminClient();

  const { error } = await supabaseAdmin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      roll_number: user.rollNumber,
      role,
    },
    { onConflict: "id" }
  );

  if (error) throw error;

  return role;
}

/**
 * Recomputes profiles.role for anyone holding one of these roll numbers.
 *
 * Role is otherwise only resolved at login, so adding someone to the residents
 * list left them a viewer -- unable to occupy the pantry room, use a washing
 * machine or raise a WiFi ticket -- until they happened to sign out and back
 * in. Nobody would guess that, so the residents admin actions call this
 * immediately after changing the list.
 *
 * Uses the service-role client deliberately: profiles.role is not client
 * writable (RLS restricts updates to your own row, and the 0011 trigger rejects
 * role changes), and that is exactly the protection we want to keep. Callers
 * MUST verify the caller is an admin before calling this.
 */
export async function syncRolesForRollNumbers(rollNumbers: string[]) {
  const unique = [...new Set(rollNumbers.filter(Boolean))];
  if (unique.length === 0) return;

  const supabaseAdmin = createAdminClient();

  // PostgREST puts `in.(...)` filters in the query string, so a whole hostel's
  // worth of roll numbers in one call builds a URL long enough to be refused.
  // Everything below is chunked for that reason, not for throughput.
  const ROLL_CHUNK = 150;
  const ID_CHUNK = 100; // uuids are 36 chars, so these chunks must be smaller

  const profiles: { id: string; email: string; roll_number: string }[] = [];
  const residentRolls = new Set<string>();

  for (const chunk of chunksOf(unique, ROLL_CHUNK)) {
    const { data: found } = await supabaseAdmin
      .from("profiles")
      .select("id, email, roll_number")
      .in("roll_number", chunk);

    if (found) profiles.push(...found);

    // Read the list back rather than assuming the caller added or removed: the
    // same function then serves both, and cannot drift from resolveRole's rules.
    const { data: residents } = await supabaseAdmin
      .from("residents")
      .select("roll_number")
      .in("roll_number", chunk);

    for (const row of residents ?? []) residentRolls.add(row.roll_number);
  }

  if (profiles.length === 0) return;

  const adminEmails = getAdminEmails();
  const idsByRole: Record<Role, string[]> = { admin: [], resident: [], viewer: [] };

  for (const profile of profiles) {
    const role: Role = adminEmails.includes(profile.email.toLowerCase())
      ? "admin"
      : residentRolls.has(profile.roll_number)
        ? "resident"
        : "viewer";

    idsByRole[role].push(profile.id);
  }

  // Group by target role instead of updating per profile. Importing a full
  // hostel used to mean one request per matched profile, fired concurrently --
  // hundreds at once, enough to hit rate limits or exhaust the serverless
  // function's time. There are only three roles, so this is a handful of
  // requests no matter how many people are imported.
  for (const role of Object.keys(idsByRole) as Role[]) {
    for (const ids of chunksOf(idsByRole[role], ID_CHUNK)) {
      await supabaseAdmin.from("profiles").update({ role }).in("id", ids);
    }
  }
}

function chunksOf<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

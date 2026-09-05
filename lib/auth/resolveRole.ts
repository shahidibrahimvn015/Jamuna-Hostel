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

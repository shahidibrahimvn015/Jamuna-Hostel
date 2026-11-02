import "server-only";
import { getSessionProfile } from "@/lib/auth/getSessionProfile";

/**
 * True only when the signed-in caller's profile role is admin.
 *
 * Server actions are plain POST endpoints, so hiding a button is not access
 * control. RLS is the real boundary for the admin tables; this check sits in
 * front of it so a non-admin gets a clear "Admins only" instead of a raw
 * Postgres error, and so a future policy mistake has a second layer behind it.
 */
export async function isAdminCaller() {
  const { profile } = await getSessionProfile();
  return profile?.role === "admin";
}

export const ADMINS_ONLY = { error: "Admins only" } as const;

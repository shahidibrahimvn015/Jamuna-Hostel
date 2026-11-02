import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * How many residents there are -- the number only, never the list.
 *
 * The residents table is admin-only (migration 0020), but the budget page shows
 * every signed-in user a total of residents x per-head. This reads the count
 * with the service-role client so that figure keeps working, and it returns a
 * bare number so nothing here can leak a roll number. Only call it from
 * server code that has already required a signed-in user.
 */
export async function getResidentCount() {
  const { count } = await createAdminClient()
    .from("residents")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

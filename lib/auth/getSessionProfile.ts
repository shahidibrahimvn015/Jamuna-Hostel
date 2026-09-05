import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";

export type SessionProfile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getSessionProfile(): Promise<{
  user: { id: string; email: string } | null;
  profile: SessionProfile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user: { id: user.id, email: user.email }, profile: profile ?? null };
}

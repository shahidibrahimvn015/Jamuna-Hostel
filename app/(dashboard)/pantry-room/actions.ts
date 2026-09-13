"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_DURATION_MINUTES = 60;

export async function occupyPantryRoom(id: number, durationMinutes: number) {
  const clampedMinutes = Math.min(
    Math.max(1, Math.round(durationMinutes)),
    MAX_DURATION_MINUTES
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in", room: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("roll_number, role")
    .eq("id", user.id)
    .maybeSingle();

  // RLS would reject a viewer anyway, but it rejects by matching zero rows,
  // which is indistinguishable from "someone beat me to it". Check the role up
  // front so the two cases get different messages.
  if (profile?.role !== "resident" && profile?.role !== "admin") {
    return { error: "Only residents can occupy the pantry room.", room: null };
  }

  const startedAt = new Date();
  const endTime = new Date(startedAt.getTime() + clampedMinutes * 60_000);

  // Only claim the room if it is actually free, or if the previous booking's
  // timer has already run out (the row stays 'occupied' until something
  // reconciles it, so an expired booking still counts as free).
  //
  // This is a condition on the UPDATE rather than a read-then-write: two
  // residents pressing Occupy at the same moment would both pass a separate
  // "is it free?" query, and the second would silently overwrite the first.
  // As a WHERE clause, Postgres settles it -- exactly one update matches a row.
  const { data: room, error } = await supabase
    .from("pantry_room")
    .update({
      status: "occupied",
      occupied_by: user.id,
      occupied_by_roll_number: profile?.roll_number ?? null,
      started_at: startedAt.toISOString(),
      end_time: endTime.toISOString(),
    })
    .eq("id", id)
    .or(`status.eq.free,end_time.lt.${startedAt.toISOString()}`)
    .select()
    .maybeSingle();

  if (error) return { error: error.message, room: null };
  if (!room) {
    return {
      error: "Someone else is using the pantry room right now.",
      room: null,
    };
  }

  revalidatePath("/pantry-room");
  return { error: null, room };
}

export async function releasePantryRoom(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in", room: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  let query = supabase
    .from("pantry_room")
    .update({
      status: "free",
      occupied_by: null,
      occupied_by_roll_number: null,
      started_at: null,
      end_time: null,
    })
    .eq("id", id);

  // Admins can clear the room unconditionally. Everyone else may release only
  // their own booking -- or any booking whose timer has already expired.
  //
  // That expiry clause is load-bearing, not a convenience: PantryStatusCard's
  // handleExpire() fires this action from whichever viewer's countdown reaches
  // zero first, which is usually NOT the occupant. Restricting release to the
  // occupant alone would break auto-free and leave rows stale until the
  // occupant or an admin happened to open the page.
  if (profile?.role !== "admin") {
    query = query.or(
      `occupied_by.eq.${user.id},end_time.lt.${new Date().toISOString()}`
    );
  }

  const { data: room, error } = await query.select().maybeSingle();

  if (error) return { error: error.message, room: null };
  if (!room) {
    return {
      error: "Only the current occupant or an admin can release the room.",
      room: null,
    };
  }

  revalidatePath("/pantry-room");
  return { error: null, room };
}

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
    .select("roll_number")
    .eq("id", user.id)
    .maybeSingle();

  const startedAt = new Date();
  const endTime = new Date(startedAt.getTime() + clampedMinutes * 60_000);

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
    .select()
    .single();

  if (error) return { error: error.message, room: null };

  revalidatePath("/pantry-room");
  return { error: null, room };
}

export async function releasePantryRoom(id: number) {
  const supabase = await createClient();
  const { data: room, error } = await supabase
    .from("pantry_room")
    .update({
      status: "free",
      occupied_by: null,
      occupied_by_roll_number: null,
      started_at: null,
      end_time: null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message, room: null };

  revalidatePath("/pantry-room");
  return { error: null, room };
}

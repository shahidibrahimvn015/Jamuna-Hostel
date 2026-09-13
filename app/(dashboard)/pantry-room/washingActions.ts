"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const machineSchema = z.object({
  machine_code: z.string().trim().min(1, "Machine ID is required"),
  floor: z.enum(["ground", "1st", "2nd", "3rd"]),
  model: z.enum(["automatic", "semi_automatic"]),
  status: z.enum(["working", "maintenance"]),
});

function parseMachine(formData: FormData) {
  return machineSchema.safeParse({
    machine_code: formData.get("machine_code"),
    floor: formData.get("floor"),
    model: formData.get("model"),
    status: formData.get("status") || "working",
  });
}

// The unique index is on lower(machine_code), so a duplicate surfaces as 23505
// rather than anything readable.
function friendlyError(message: string, code?: string) {
  if (code === "23505") return "A washing machine with that ID already exists.";
  return message;
}

export async function addWashingMachine(formData: FormData) {
  const parsed = parseMachine(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("washing_machines").insert(parsed.data);

  if (error) return { error: friendlyError(error.message, error.code) };

  revalidatePath("/pantry-room");
  return { error: null };
}

export async function updateWashingMachine(id: number, formData: FormData) {
  const parsed = parseMachine(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("washing_machines")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: friendlyError(error.message, error.code) };

  revalidatePath("/pantry-room");
  return { error: null };
}

export async function deleteWashingMachine(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("washing_machines").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/pantry-room");
  return { error: null };
}

export async function occupyWashingSlot(slotId: number, durationMinutes: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in", slot: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("roll_number, role")
    .eq("id", user.id)
    .maybeSingle();

  // RLS rejects viewers by matching zero rows, which is indistinguishable from
  // "someone beat me to it". Check the role up front for a usable message.
  if (profile?.role !== "resident" && profile?.role !== "admin") {
    return { error: "Only residents can use the washing machines.", slot: null };
  }

  const { data: slot } = await supabase
    .from("washing_machine_slots")
    .select("id, machine_id, max_minutes")
    .eq("id", slotId)
    .maybeSingle();

  if (!slot) return { error: "Washing machine not found.", slot: null };

  const { data: machine } = await supabase
    .from("washing_machines")
    .select("status")
    .eq("id", slot.machine_id)
    .maybeSingle();

  if (machine?.status !== "working") {
    return { error: "This washing machine is under maintenance.", slot: null };
  }

  // The cap comes from the slot row (wash 90, washer 60, dryer 30) rather than
  // being hardcoded per model here.
  const clamped = Math.min(
    Math.max(1, Math.round(durationMinutes)),
    slot.max_minutes
  );

  const startedAt = new Date();
  const endTime = new Date(startedAt.getTime() + clamped * 60_000);

  // Conditional update rather than read-then-write: two residents pressing
  // Occupy at the same moment would both pass a separate "is it free?" check.
  const { data: updated, error } = await supabase
    .from("washing_machine_slots")
    .update({
      status: "occupied",
      occupied_by: user.id,
      occupied_by_roll_number: profile?.roll_number ?? null,
      started_at: startedAt.toISOString(),
      end_time: endTime.toISOString(),
    })
    .eq("id", slotId)
    .or(`status.eq.free,end_time.lt.${startedAt.toISOString()}`)
    .select()
    .maybeSingle();

  if (error) return { error: error.message, slot: null };
  if (!updated) {
    return { error: "Someone else is using this right now.", slot: null };
  }

  revalidatePath("/pantry-room");
  return { error: null, slot: updated };
}

export async function releaseWashingSlot(slotId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in", slot: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  let query = supabase
    .from("washing_machine_slots")
    .update({
      status: "free",
      occupied_by: null,
      occupied_by_roll_number: null,
      started_at: null,
      end_time: null,
    })
    .eq("id", slotId);

  // Admins clear any slot. Everyone else releases only their own booking -- or
  // any expired one, which is the lazy-reconcile path: the countdown fires this
  // from whichever viewer hits zero first, usually not the occupant.
  if (profile?.role !== "admin") {
    query = query.or(
      `occupied_by.eq.${user.id},end_time.lt.${new Date().toISOString()}`
    );
  }

  const { data: updated, error } = await query.select().maybeSingle();

  if (error) return { error: error.message, slot: null };
  if (!updated) {
    return {
      error: "Only the current user or an admin can release this.",
      slot: null,
    };
  }

  revalidatePath("/pantry-room");
  return { error: null, slot: updated };
}

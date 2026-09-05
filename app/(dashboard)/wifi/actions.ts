"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const optionalText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((s) => s || null);

export async function addTroubleshootingBlock(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return { error: "Title cannot be empty" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("wifi_troubleshooting_blocks")
    .insert({ title: trimmed });

  if (error) return { error: error.message };

  revalidatePath("/wifi");
  return { error: null };
}

export async function deleteTroubleshootingBlock(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("wifi_troubleshooting_blocks")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/wifi");
  return { error: null };
}

export async function addTroubleshootingTip(blockId: number, tip: string) {
  const trimmed = tip.trim();
  if (!trimmed) return { error: "Tip cannot be empty" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("wifi_troubleshooting_tips")
    .insert({ block_id: blockId, tip: trimmed });

  if (error) return { error: error.message };

  revalidatePath("/wifi");
  return { error: null };
}

export async function deleteTroubleshootingTip(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("wifi_troubleshooting_tips")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/wifi");
  return { error: null };
}

const ticketSchema = z.object({
  smail_id: z.string().trim().email(),
  room_number: z.string().trim().min(1, "Room number is required"),
  contact_number: optionalText,
  mac_address: optionalText,
  issue_description: z.string().trim().min(1, "Please describe the issue"),
  mail_sent: z.boolean(),
});

export async function logTicket(input: {
  smail_id: string;
  room_number: string;
  contact_number?: string | null;
  mac_address?: string | null;
  issue_description: string;
  mail_sent: boolean;
}) {
  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("wifi_tickets")
    .insert({ ...parsed.data, raised_by: user.id });

  if (error) return { error: error.message };

  revalidatePath("/wifi");
  return { error: null };
}

export async function resolveTicket(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("wifi_tickets")
    .update({ status: "resolved" })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/wifi");
  return { error: null };
}

export async function deleteTicket(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("wifi_tickets").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/wifi");
  return { error: null };
}

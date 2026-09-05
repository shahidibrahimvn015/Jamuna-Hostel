"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const rollNumberSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-zA-Z0-9]+$/, "Roll number can only contain letters and numbers")
  .transform((s) => s.toLowerCase());

export async function addResident(formData: FormData) {
  const parsed = rollNumberSchema.safeParse(formData.get("roll_number"));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("residents")
    .upsert({ roll_number: parsed.data, added_by: user?.id }, { onConflict: "roll_number" });

  if (error) return { error: error.message };

  revalidatePath("/admin/residents");
  return { error: null };
}

export async function deleteResident(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("residents").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/residents");
  return { error: null };
}

export async function bulkAddResidents(rawText: string) {
  const tokens = rawText
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const rows: { roll_number: string; added_by?: string }[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  for (const token of tokens) {
    const parsed = rollNumberSchema.safeParse(token);

    if (!parsed.success) {
      errors.push(`"${token}": ${parsed.error.issues[0]?.message}`);
      continue;
    }

    if (seen.has(parsed.data)) continue;
    seen.add(parsed.data);
    rows.push({ roll_number: parsed.data, added_by: user?.id });
  }

  if (rows.length === 0) {
    return { error: errors.join("; ") || "No valid roll numbers found", count: 0 };
  }

  const { error } = await supabase
    .from("residents")
    .upsert(rows, { onConflict: "roll_number" });

  if (error) return { error: error.message, count: 0 };

  revalidatePath("/admin/residents");
  return {
    error: errors.length > 0 ? errors.join("; ") : null,
    count: rows.length,
  };
}

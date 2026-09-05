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

export async function updateFirstAidInfo(formData: FormData) {
  const parsed = z
    .object({ contents: optionalText, guidelines: optionalText })
    .safeParse({
      contents: formData.get("contents") || null,
      guidelines: formData.get("guidelines") || null,
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("first_aid_info")
    .update({ ...parsed.data, updated_by: user?.id })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/emergency");
  return { error: null };
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  role_title: optionalText,
  phone: z.string().trim().min(1, "Phone is required"),
});

export async function addEmergencyContact(formData: FormData) {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    role_title: formData.get("role_title") || null,
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("emergency_contacts")
    .insert(parsed.data);

  if (error) return { error: error.message };

  revalidatePath("/emergency");
  return { error: null };
}

export async function deleteEmergencyContact(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("emergency_contacts")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/emergency");
  return { error: null };
}

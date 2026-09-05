"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { uploadRepPhoto } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

const optionalText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((s) => s || null);

const repSchema = z.object({
  section: z.enum(["office", "council"]),
  name: z.string().trim().min(1, "Name is required"),
  role_title: optionalText,
  phone: optionalText,
  email: optionalText,
});

function parseForm(formData: FormData) {
  return repSchema.safeParse({
    section: formData.get("section"),
    name: formData.get("name"),
    role_title: formData.get("role_title") || null,
    phone: formData.get("phone") || null,
    email: formData.get("email") || null,
  });
}

async function extractPhotoPath(formData: FormData) {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return null;
  const uploaded = await uploadRepPhoto(file);
  return uploaded.path;
}

export async function addHostelRep(formData: FormData) {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let photoPath: string | null = null;
  try {
    photoPath = await extractPhotoPath(formData);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("hostel_reps")
    .insert({ ...parsed.data, photo_path: photoPath });

  if (error) return { error: error.message };

  revalidatePath("/hostel-rep");
  return { error: null };
}

export async function updateHostelRep(id: number, formData: FormData) {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const update: typeof parsed.data & { photo_path?: string } = {
    ...parsed.data,
  };

  try {
    const photoPath = await extractPhotoPath(formData);
    if (photoPath) update.photo_path = photoPath;
  } catch (e) {
    return { error: (e as Error).message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("hostel_reps")
    .update(update)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/hostel-rep");
  return { error: null };
}

export async function deleteHostelRep(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("hostel_reps").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/hostel-rep");
  return { error: null };
}

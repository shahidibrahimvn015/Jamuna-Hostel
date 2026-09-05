"use server";

import { revalidatePath } from "next/cache";
import { uploadNoticePosterImage } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export async function addNotice(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const file = formData.get("poster");

  if (!title) return { error: "Title is required" };
  if (!description) return { error: "Description is required" };
  if (!eventDate) return { error: "Date is required" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let posterPath: string | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      const uploaded = await uploadNoticePosterImage(file);
      posterPath = uploaded.path;
    } catch (e) {
      return { error: (e as Error).message };
    }
  }

  const { error } = await supabase.from("notices").insert({
    title,
    description,
    event_date: eventDate,
    poster_path: posterPath,
    created_by: user?.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/notice-board");
  return { error: null };
}

export async function deleteNotice(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("notices").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/notice-board");
  return { error: null };
}

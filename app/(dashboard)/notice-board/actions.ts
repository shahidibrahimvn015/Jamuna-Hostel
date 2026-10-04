"use server";

import { revalidatePath } from "next/cache";
import {
  removeStorageObject,
  uploadNoticePosterImage,
} from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export async function addNotice(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim();
  const file = formData.get("poster");

  if (!title) return { error: "Title is required" };
  if (!description) return { error: "Description is required" };
  if (!eventDate) return { error: "Date is required" };

  // This value is rendered as an href, so restrict it to http(s) rather than
  // accepting any string: javascript: and data: URLs would otherwise run in
  // the clicker's session. Admins are trusted, but a dead or hostile link
  // costs nothing to rule out here.
  if (linkUrl) {
    let ok = false;
    try {
      const parsed = new URL(linkUrl);
      ok = parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      ok = false;
    }
    if (!ok) {
      return { error: "Link must be a valid http:// or https:// URL" };
    }
  }

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
    link_url: linkUrl || null,
    created_by: user?.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/notice-board");
  return { error: null };
}

export async function deleteNotice(id: number) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("notices")
    .select("poster_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("notices").delete().eq("id", id);

  if (error) return { error: error.message };

  await removeStorageObject("notice-posters", existing?.poster_path);

  revalidatePath("/notice-board");
  return { error: null };
}

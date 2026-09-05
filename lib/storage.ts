import "server-only";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function uploadBillPdf(
  file: File,
  portfolioId: number,
  budgetItemId: number
) {
  const supabase = await createClient();
  const path = `${portfolioId}/${budgetItemId}/${randomUUID()}.pdf`;

  const { error } = await supabase.storage.from("bills").upload(path, file, {
    contentType: "application/pdf",
  });

  if (error) throw error;
  return path;
}

export async function getBillSignedUrl(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("bills")
    .createSignedUrl(path, 3600);

  if (error) throw error;
  return data.signedUrl;
}

export async function uploadNoticePosterImage(file: File) {
  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "png";
  const path = `${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("notice-posters")
    .upload(path, file, { contentType: file.type || "image/png" });

  if (error) throw error;

  const { data } = supabase.storage.from("notice-posters").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function uploadRepPhoto(file: File) {
  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "png";
  const path = `${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("rep-photos")
    .upload(path, file, { contentType: file.type || "image/png" });

  if (error) throw error;

  const { data } = supabase.storage.from("rep-photos").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

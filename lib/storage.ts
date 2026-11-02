import "server-only";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

// The two image buckets are world-readable, so what lands there is served to
// anyone. Take the extension and content type from an allowlist keyed on the
// declared MIME type instead of trusting file.name -- an upload named
// "x.html" or declared "text/html" is refused rather than stored and served.
// SVG is excluded on purpose: it can carry script.
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

function imageExtension(file: File) {
  const ext = IMAGE_EXTENSIONS[file.type];
  if (!ext) throw new Error("Only PNG, JPG, WebP or GIF images are allowed");
  return ext;
}

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
  const ext = imageExtension(file);
  const path = `${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("notice-posters")
    .upload(path, file, { contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from("notice-posters").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function uploadRepPhoto(file: File) {
  const supabase = await createClient();
  const ext = imageExtension(file);
  const path = `${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("rep-photos")
    .upload(path, file, { contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from("rep-photos").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

/**
 * Best-effort removal of a stored file.
 *
 * Callers delete the database row FIRST and then call this. That ordering is
 * deliberate: if the row is gone but this fails, the worst case is an orphaned
 * file (what we had everywhere before). Deleting the file first would risk the
 * opposite -- a surviving row pointing at a missing image, i.e. a broken card.
 *
 * A failure here is therefore not worth failing the caller's action over: the
 * thing the admin actually asked for (remove the rep / notice) already
 * succeeded.
 */
export async function removeStorageObject(
  bucket: "rep-photos" | "notice-posters" | "bills",
  path: string | null | undefined
) {
  if (!path) return;
  const supabase = await createClient();
  await supabase.storage.from(bucket).remove([path]);
}

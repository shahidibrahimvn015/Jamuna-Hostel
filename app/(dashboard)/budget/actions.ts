"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getBillSignedUrl, uploadBillPdf } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export async function createPortfolio(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  const supabase = await createClient();
  const { error } = await supabase.from("secretary_portfolios").insert({ name });

  if (error) return { error: error.message };

  revalidatePath("/budget");
  return { error: null };
}

const itemSchema = z.object({
  portfolio_id: z.coerce.number(),
  item: z.string().trim().min(1, "Item name is required"),
  budget: z.coerce.number().min(0),
  spent: z.coerce.number().min(0),
});

async function maybeUploadBill(
  formData: FormData,
  portfolioId: number,
  itemId: number
) {
  const file = formData.get("bill");
  if (file instanceof File && file.size > 0) {
    return uploadBillPdf(file, portfolioId, itemId);
  }
  return null;
}

export async function createBudgetItem(formData: FormData) {
  const parsed = itemSchema.safeParse({
    portfolio_id: formData.get("portfolio_id"),
    item: formData.get("item"),
    budget: formData.get("budget") || 0,
    spent: formData.get("spent") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: inserted, error } = await supabase
    .from("budget_items")
    .insert({ ...parsed.data, created_by: user?.id })
    .select("id")
    .single();

  if (error || !inserted) return { error: error?.message ?? "Insert failed" };

  const billPath = await maybeUploadBill(
    formData,
    parsed.data.portfolio_id,
    inserted.id
  ).catch(() => null);

  if (billPath) {
    await supabase
      .from("budget_items")
      .update({ bill_path: billPath })
      .eq("id", inserted.id);
  }

  revalidatePath("/budget");
  return { error: null };
}

export async function updateBudgetItem(id: number, formData: FormData) {
  const parsed = itemSchema
    .omit({ portfolio_id: true })
    .safeParse({
      item: formData.get("item"),
      budget: formData.get("budget") || 0,
      spent: formData.get("spent") || 0,
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("budget_items")
    .select("portfolio_id")
    .eq("id", id)
    .single();

  const update: {
    item: string;
    budget: number;
    spent: number;
    bill_path?: string;
  } = { ...parsed.data };

  if (existing) {
    const billPath = await maybeUploadBill(
      formData,
      existing.portfolio_id,
      id
    ).catch(() => null);
    if (billPath) update.bill_path = billPath;
  }

  const { error } = await supabase
    .from("budget_items")
    .update(update)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/budget");
  return { error: null };
}

export async function deleteBudgetItem(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("budget_items").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/budget");
  return { error: null };
}

export async function getBillUrl(path: string) {
  try {
    const url = await getBillSignedUrl(path);
    return { url, error: null };
  } catch (e) {
    return { url: null, error: (e as Error).message };
  }
}

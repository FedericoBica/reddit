"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/modules/auth/admin";
import { parseBillingPlan } from "@/modules/billing/limits";

export async function updateUserBillingPlan(formData: FormData) {
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const plan = parseBillingPlan(String(formData.get("plan") ?? ""));

  if (!userId || !plan) return;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("users").update({ billing_plan: plan }).eq("id", userId);
  if (error) throw new Error(`Failed to update user billing plan: ${error.message}`);

  revalidatePath("/admin/users");
}

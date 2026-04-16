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
  await supabase.from("users").update({ billing_plan: plan }).eq("id", userId);

  revalidatePath("/admin/users");
}

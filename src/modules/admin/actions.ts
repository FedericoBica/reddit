"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { inngest } from "@/inngest/client";
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

export async function retryProjectSearchbox(formData: FormData) {
  await requireAdmin();

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;

  await inngest.send({ name: "project/searchbox.requested", data: { projectId } });

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function retryProjectBackfill(formData: FormData) {
  await requireAdmin();

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return;

  await inngest.send({ name: "project/backfill.requested", data: { projectId } });

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function updateAdminProjectStatus(formData: FormData) {
  await requireAdmin();

  const projectId = String(formData.get("projectId") ?? "");
  const statusRaw = String(formData.get("status") ?? "");
  const status = ["active", "archived", "suspended"].includes(statusRaw)
    ? (statusRaw as "active" | "archived" | "suspended")
    : null;
  if (!projectId || !status) return;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);
  if (error) throw new Error(`Failed to update project status: ${error.message}`);

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function deleteAdminProject(formData: FormData) {
  await requireAdmin();

  const projectId = String(formData.get("projectId") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (!projectId || confirmation !== "DELETE") return;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(`Failed to delete project: ${error.message}`);

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
}

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/server";
import type { XProfileDTO } from "@/db/schemas/domain";

export async function getXProfile(projectId: string): Promise<XProfileDTO | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("x_profiles")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  return data ?? null;
}

export async function saveXContextFromForm(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireUser("/x/context");

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return { ok: false, error: "Missing project" };

  const interests = formData.getAll("interests").map(String).filter(Boolean);
  const favoriteCreators = formData.getAll("favoriteCreators").map(String).map((s) => s.trim().replace(/^@/, "")).filter(Boolean).slice(0, 3);
  const useOwnTweets = formData.get("useOwnTweets") === "on";
  const structureTypes = formData.getAll("structureTypes").map(String).filter(Boolean).slice(0, 3);
  const products = formData.getAll("products").map(String).map((s) => s.trim()).filter(Boolean).slice(0, 5);
  const xRules = String(formData.get("xRules") ?? "").trim() || null;

  const supabase = await createSupabaseServerClient();
  await supabase.from("x_profiles").upsert(
    {
      project_id: projectId,
      interests,
      favorite_creators: favoriteCreators,
      use_own_tweets: useOwnTweets,
      structure_types: structureTypes,
      products,
      x_rules: xRules,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id" },
  );

  revalidatePath("/x/context");
  return { ok: true };
}

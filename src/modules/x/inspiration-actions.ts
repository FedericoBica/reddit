"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/server";
import { generateXPost } from "./x-post-generator";
import { getXProfile } from "./context-actions";
import { resolveCurrentProject } from "@/modules/projects/current";
import { INSPIRATION_ANGLES } from "./inspiration-config";

export async function generateInspirationAction(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser("/x/inspiration");

  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) return { ok: false, error: "Missing project" };

  const projectState = await resolveCurrentProject(projectId);
  if (projectState.status === "missing") return { ok: false, error: "Project not found" };
  const { currentProject: project } = projectState;

  const profile = await getXProfile(projectId);
  if (!profile) return { ok: false, error: "Set up your X Context profile first." };

  const supabase = await createSupabaseServerClient();

  // Delete any existing inspiration drafts for today to prevent stale accumulation
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  await supabase
    .from("x_scheduled_posts")
    .delete()
    .eq("project_id", projectId)
    .eq("source", "inspiration")
    .eq("status", "draft")
    .gte("created_at", todayStart.toISOString());

  // Generate all 5 angles in parallel
  type AngleResult = { content: string; hookExplanation: string; categoryId: string };

  const results = await Promise.allSettled<AngleResult>(
    INSPIRATION_ANGLES.map(async (angleConfig) => {
      const r = await generateXPost({
        project: {
          name: project.name,
          website_url: project.website_url,
          value_proposition: project.value_proposition,
        },
        profile,
        angle: angleConfig.angle,
      });
      return { content: r.content, hookExplanation: r.hookExplanation, categoryId: angleConfig.id };
    }),
  );

  const inserts = results
    .filter((r): r is PromiseFulfilledResult<AngleResult> => r.status === "fulfilled")
    .map((r) => ({
      project_id: projectId,
      created_by: user.id,
      content: r.value.content,
      hook_explanation: r.value.hookExplanation,
      category: r.value.categoryId,
      source: "inspiration" as const,
      status: "draft" as const,
    }));

  if (inserts.length === 0) return { ok: false, error: "Generation failed. Check your X Context profile." };

  const { error } = await supabase.from("x_scheduled_posts").insert(inserts);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/x/inspiration");
  return { ok: true };
}

export async function dismissInspirationAction(_prev: void, formData: FormData): Promise<void> {
  await requireUser("/x/inspiration");

  const projectId = String(formData.get("projectId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  if (!projectId || !postId) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("x_scheduled_posts")
    .delete()
    .eq("id", postId)
    .eq("project_id", projectId)
    .eq("source", "inspiration");

  revalidatePath("/x/inspiration");
}

export async function updateInspirationContentAction(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  await requireUser("/x/inspiration");

  const projectId = String(formData.get("projectId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!projectId || !postId || !content) return { ok: false, error: "Missing fields" };
  if (content.length > 280) return { ok: false, error: "Exceeds 280 characters" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("x_scheduled_posts")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("project_id", projectId)
    .eq("source", "inspiration");

  if (error) return { ok: false, error: error.message };
  revalidatePath("/x/inspiration");
  return { ok: true };
}

export async function listTodayInspirations(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("x_scheduled_posts")
    .select("id, project_id, created_by, connected_account_id, content, scheduled_for, status, published_at, x_tweet_id, error, source, category, hook_explanation, created_at, updated_at")
    .eq("project_id", projectId)
    .eq("source", "inspiration")
    .eq("status", "draft")
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: true });

  return data ?? [];
}

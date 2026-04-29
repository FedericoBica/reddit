"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/server";
import { generateXPost } from "./x-post-generator";
import { getXProfile } from "./context-actions";
import {
  disconnectXAccount,
  getConnectedAccountWithTokens,
  postTweet,
  refreshXToken,
} from "./x-oauth";
import { resolveCurrentProject } from "@/modules/projects/current";

export type GeneratePostResult =
  | { ok: true; content: string; hookExplanation: string }
  | { ok: false; error: string };

export async function generatePostAction(formData: FormData): Promise<GeneratePostResult> {
  await requireUser("/x/studio");

  const projectId = String(formData.get("projectId") ?? "");
  const topic = String(formData.get("topic") ?? "").trim() || undefined;
  const angle = String(formData.get("angle") ?? "").trim() || undefined;

  if (!projectId) return { ok: false, error: "Missing project" };

  const projectState = await resolveCurrentProject(projectId);
  if (projectState.status === "missing") return { ok: false, error: "Project not found" };
  const { currentProject: project } = projectState;

  const profile = await getXProfile(projectId);
  if (!profile) return { ok: false, error: "Set up your X Context profile first." };

  try {
    const result = await generateXPost({
      project: {
        name: project.name,
        website_url: project.website_url,
        value_proposition: project.value_proposition,
      },
      profile,
      topic,
      angle,
    });
    return { ok: true, content: result.content, hookExplanation: result.hookExplanation };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Generation failed" };
  }
}

export async function saveDraftAction(
  _prev: { ok: boolean; id?: string; error?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const user = await requireUser("/x/studio");

  const projectId = String(formData.get("projectId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const source = (String(formData.get("source") ?? "ai_writer")) as "ai_writer" | "inspiration" | "manual";

  if (!projectId || !content) return { ok: false, error: "Missing content" };
  if (content.length > 280) return { ok: false, error: "Post exceeds 280 characters" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("x_scheduled_posts")
    .insert({
      project_id: projectId,
      created_by: user.id,
      content,
      status: "draft",
      source,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/x/queue");
  return { ok: true, id: data.id };
}

export async function schedulePostAction(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser("/x/queue");

  const projectId = String(formData.get("projectId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const scheduledFor = String(formData.get("scheduledFor") ?? "").trim();
  const postId = String(formData.get("postId") ?? "").trim() || undefined;
  const source = (String(formData.get("source") ?? "manual")) as "ai_writer" | "inspiration" | "manual";

  if (!projectId || !content) return { ok: false, error: "Missing content" };
  if (!scheduledFor) return { ok: false, error: "Missing schedule time" };
  if (content.length > 280) return { ok: false, error: "Post exceeds 280 characters" };

  const supabase = await createSupabaseServerClient();

  if (postId) {
    const { error } = await supabase
      .from("x_scheduled_posts")
      .update({ content, scheduled_for: scheduledFor, status: "scheduled", updated_at: new Date().toISOString() })
      .eq("id", postId)
      .eq("project_id", projectId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("x_scheduled_posts")
      .insert({
        project_id: projectId,
        created_by: user.id,
        content,
        scheduled_for: scheduledFor,
        status: "scheduled",
        source,
      });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/x/queue");
  return { ok: true };
}

export async function postNowAction(
  _prev: { ok: boolean; error?: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser("/x/queue");

  const requestedProjectId = String(formData.get("projectId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const postId = String(formData.get("postId") ?? "").trim() || undefined;
  const source = (String(formData.get("source") ?? "manual")) as "ai_writer" | "inspiration" | "manual";

  if (!requestedProjectId || !content) return { ok: false, error: "Missing content" };
  if (content.length > 280) return { ok: false, error: "Post exceeds 280 characters" };

  const projectState = await resolveCurrentProject(requestedProjectId);
  if (projectState.status === "missing") return { ok: false, error: "Project not found" };
  const currentProjectId = projectState.currentProject.id;

  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();
  let dbPostId = postId;
  let effectiveProjectId = currentProjectId;
  let effectiveContent = content;

  if (dbPostId) {
    const { data: existingPost, error: loadError } = await supabase
      .from("x_scheduled_posts")
      .select("id, project_id, content")
      .eq("id", dbPostId)
      .maybeSingle();

    if (loadError) return { ok: false, error: loadError.message };
    if (!existingPost) return { ok: false, error: "Post not found" };
    if (existingPost.project_id !== currentProjectId) {
      return { ok: false, error: "Post does not belong to the current project" };
    }

    effectiveProjectId = existingPost.project_id;
    effectiveContent = existingPost.content;
  }

  const account = await getConnectedAccountWithTokens(effectiveProjectId);
  if (!account) return { ok: false, error: "No X account connected. Go to My Context to connect." };

  let accessToken = account.access_token;

  // refresh if expired
  if (account.token_expires_at && account.refresh_token) {
    const expiresAt = new Date(account.token_expires_at);
    if (expiresAt <= new Date()) {
      try {
        const refreshed = await refreshXToken(account.refresh_token);
        accessToken = refreshed.access_token;
        const newExpiry = refreshed.expires_in
          ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
          : null;
        const { error: persistError } = await supabaseAdmin
          .from("x_connected_accounts")
          .update({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token ?? account.refresh_token,
            token_expires_at: newExpiry,
            updated_at: new Date().toISOString(),
          })
          .eq("id", account.id);
        if (persistError) return { ok: false, error: persistError.message };
      } catch {
        return { ok: false, error: "Token expired and refresh failed. Reconnect your X account." };
      }
    }
  }

  if (!dbPostId) {
    const { data, error } = await supabase
      .from("x_scheduled_posts")
      .insert({
        project_id: effectiveProjectId,
        created_by: user.id,
        content: effectiveContent,
        status: "publishing",
        source,
        connected_account_id: account.id,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    dbPostId = data.id;
  } else {
    const { data: transitionedPost, error: transitionError } = await supabase
      .from("x_scheduled_posts")
      .update({ status: "publishing", updated_at: new Date().toISOString() })
      .eq("id", dbPostId)
      .eq("project_id", effectiveProjectId)
      .select("id")
      .maybeSingle();
    if (transitionError) return { ok: false, error: transitionError.message };
    if (!transitionedPost) return { ok: false, error: "Post could not transition to publishing" };
  }

  try {
    const tweet = await postTweet(accessToken, effectiveContent);
    const { error: publishError } = await supabase
      .from("x_scheduled_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        x_tweet_id: tweet.id,
        connected_account_id: account.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dbPostId)
      .eq("project_id", effectiveProjectId);
    if (publishError) return { ok: false, error: publishError.message };
  } catch (err) {
    await supabase
      .from("x_scheduled_posts")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", dbPostId)
      .eq("project_id", effectiveProjectId);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to post" };
  }

  revalidatePath("/x/queue");
  return { ok: true };
}

export async function deletePostAction(_prev: void, formData: FormData): Promise<void> {
  await requireUser("/x/queue");

  const projectId = String(formData.get("projectId") ?? "");
  const postId = String(formData.get("postId") ?? "");

  if (!projectId || !postId) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("x_scheduled_posts")
    .delete()
    .eq("id", postId)
    .eq("project_id", projectId);

  revalidatePath("/x/queue");
}

export async function disconnectXAccountAction(_prev: void, formData: FormData): Promise<void> {
  await requireUser("/x/context");

  const requestedProjectId = String(formData.get("projectId") ?? "");
  if (!requestedProjectId) return;

  const projectState = await resolveCurrentProject(requestedProjectId);
  if (projectState.status === "missing") return;

  await disconnectXAccount(projectState.currentProject.id);

  revalidatePath("/x/context");
  redirect(`/x/context?projectId=${projectState.currentProject.id}`);
}

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { projectIdSchema } from "@/db/schemas/domain";

export async function addKeyword(
  projectId: string,
  term: string,
): Promise<void> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const normalized = term.trim().replace(/\s+/g, " ");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("keywords")
    .upsert(
      { project_id: parsedProjectId, term: normalized, type: "custom", is_active: true },
      { onConflict: "project_id,term", ignoreDuplicates: false },
    );

  if (error) {
    throw new Error(`Failed to add keyword: ${error.message}`);
  }
}

export async function removeKeyword(projectId: string, keywordId: string): Promise<void> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("keywords")
    .delete()
    .eq("project_id", parsedProjectId)
    .eq("id", keywordId);

  if (error) {
    throw new Error(`Failed to remove keyword: ${error.message}`);
  }
}

export async function toggleKeyword(
  projectId: string,
  keywordId: string,
  isActive: boolean,
): Promise<void> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("keywords")
    .update({ is_active: isActive })
    .eq("project_id", parsedProjectId)
    .eq("id", keywordId);

  if (error) {
    throw new Error(`Failed to toggle keyword: ${error.message}`);
  }
}

export async function addSubreddit(
  projectId: string,
  name: string,
): Promise<void> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const normalized = name.trim().replace(/^r\//i, "").replace(/^\/r\//i, "").replace(/\s+/g, "");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("subreddits")
    .upsert(
      { project_id: parsedProjectId, name: normalized, type: "custom", is_active: true, is_regional: false },
      { onConflict: "project_id,name", ignoreDuplicates: false },
    );

  if (error) {
    throw new Error(`Failed to add subreddit: ${error.message}`);
  }
}

export async function removeSubreddit(projectId: string, subredditId: string): Promise<void> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("subreddits")
    .delete()
    .eq("project_id", parsedProjectId)
    .eq("id", subredditId);

  if (error) {
    throw new Error(`Failed to remove subreddit: ${error.message}`);
  }
}

export async function toggleSubreddit(
  projectId: string,
  subredditId: string,
  isActive: boolean,
): Promise<void> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("subreddits")
    .update({ is_active: isActive })
    .eq("project_id", parsedProjectId)
    .eq("id", subredditId);

  if (error) {
    throw new Error(`Failed to toggle subreddit: ${error.message}`);
  }
}

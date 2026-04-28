import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { projectIdSchema, type XKeywordDTO, type XPostDTO, type XPostReplyDTO } from "@/db/schemas/domain";
import type { PostgrestError } from "@supabase/supabase-js";

const xKeywordColumns = `id, project_id, query, is_active, created_at, updated_at`;
const xPostColumns = `
  id,
  project_id,
  x_post_id,
  author_id,
  author_username,
  author_name,
  author_verified,
  author_followers_count,
  text,
  permalink,
  lang,
  posted_at,
  like_count,
  retweet_count,
  reply_count,
  quote_count,
  bookmark_count,
  impression_count,
  intent_score,
  intent_type,
  sentiment,
  classification_reason,
  classifier_prompt_version,
  keywords_matched,
  status,
  reply_generation_status,
  reply_generation_error,
  reply_generation_requested_at,
  reply_generation_completed_at,
  created_at,
  updated_at
`;

const xPostReplyColumns = `
  id,
  x_post_id,
  project_id,
  created_by,
  style,
  content,
  prompt_version,
  model,
  input_tokens,
  output_tokens,
  was_used,
  created_at
`;

function isMissingXTableError(error: PostgrestError | null): boolean {
  if (!error) return false;

  const haystack = `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  return (
    haystack.includes("x_keywords")
    || haystack.includes("x_posts")
    || haystack.includes("could not find the table")
    || haystack.includes("relation")
    || haystack.includes("does not exist")
    || error.code === "PGRST205"
    || error.code === "42P01"
  );
}

export async function listProjectXKeywords(projectId: string): Promise<XKeywordDTO[]> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("x_keywords")
    .select(xKeywordColumns)
    .eq("project_id", parsedProjectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn(
      `[x] listProjectXKeywords fallback for project ${parsedProjectId}: ${error.code ?? "unknown"} ${error.message}`,
    );
    if (isMissingXTableError(error)) return [];
    return [];
  }

  return data;
}

export async function listProjectXPosts(projectId: string, limit = 200): Promise<XPostDTO[]> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("x_posts")
    .select(xPostColumns)
    .eq("project_id", parsedProjectId)
    .order("intent_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn(
      `[x] listProjectXPosts fallback for project ${parsedProjectId}: ${error.code ?? "unknown"} ${error.message}`,
    );
    if (isMissingXTableError(error)) return [];
    return [];
  }

  return data;
}

export async function getXPostById(projectId: string, postId: string): Promise<XPostDTO | null> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("x_posts")
    .select(xPostColumns)
    .eq("project_id", parsedProjectId)
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    console.warn(
      `[x] getXPostById fallback for project ${parsedProjectId}, post ${postId}: ${error.code ?? "unknown"} ${error.message}`,
    );
    if (isMissingXTableError(error)) return null;
    return null;
  }

  return data;
}

export async function listXPostReplies(projectId: string, xPostId: string): Promise<XPostReplyDTO[]> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("x_post_replies")
    .select(xPostReplyColumns)
    .eq("project_id", parsedProjectId)
    .eq("x_post_id", xPostId)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn(`[x] listXPostReplies fallback: ${error.code ?? "unknown"} ${error.message}`);
    return [];
  }

  return data;
}

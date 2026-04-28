import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { projectIdSchema, type XKeywordDTO, type XPostDTO } from "@/db/schemas/domain";

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
  sentiment,
  classification_reason,
  classifier_prompt_version,
  keywords_matched,
  status,
  created_at,
  updated_at
`;

export async function listProjectXKeywords(projectId: string): Promise<XKeywordDTO[]> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("x_keywords")
    .select(xKeywordColumns)
    .eq("project_id", parsedProjectId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list X keywords: ${error.message}`);
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
    throw new Error(`Failed to list X posts: ${error.message}`);
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
    throw new Error(`Failed to load X post: ${error.message}`);
  }

  return data;
}

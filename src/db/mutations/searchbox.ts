import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SearchboxResultDTO, UpdateSearchboxResultStatusInput } from "@/db/schemas/domain";

const searchboxResultDTOColumns = [
  "id",
  "project_id",
  "reddit_post_id",
  "google_keyword",
  "google_rank",
  "title",
  "body",
  "subreddit",
  "author",
  "permalink",
  "url",
  "reddit_score",
  "reddit_num_comments",
  "reddit_created_utc",
  "intent_score",
  "classification_reason",
  "status",
  "first_seen_at",
  "last_seen_at",
  "created_at",
].join(", ");

type UpsertSearchboxResultInput = {
  projectId: string;
  redditPostId: string;
  googleKeyword: string;
  googleRank: number;
  title: string;
  body: string | null;
  subreddit: string;
  author: string | null;
  permalink: string;
  url: string | null;
  redditScore: number | null;
  redditNumComments: number | null;
  redditCreatedUtc: string | null;
  intentScore: number | null;
  classificationReason: string | null;
};

export async function upsertSearchboxResult(
  input: UpsertSearchboxResultInput,
): Promise<{ result: SearchboxResultDTO; isNew: boolean }> {
  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("searchbox_results")
    .select("id, status")
    .eq("project_id", input.projectId)
    .eq("reddit_post_id", input.redditPostId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("searchbox_results")
      .update({
        google_keyword: input.googleKeyword,
        google_rank: input.googleRank,
        intent_score: input.intentScore,
        classification_reason: input.classificationReason,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select(searchboxResultDTOColumns)
      .single();

    if (error) throw new Error(`Failed to update searchbox result: ${error.message}`);
    return { result: data as unknown as SearchboxResultDTO, isNew: false };
  }

  const { data, error } = await supabase
    .from("searchbox_results")
    .insert({
      project_id: input.projectId,
      reddit_post_id: input.redditPostId,
      google_keyword: input.googleKeyword,
      google_rank: input.googleRank,
      title: input.title,
      body: input.body,
      subreddit: input.subreddit,
      author: input.author,
      permalink: input.permalink,
      url: input.url,
      reddit_score: input.redditScore,
      reddit_num_comments: input.redditNumComments,
      reddit_created_utc: input.redditCreatedUtc,
      intent_score: input.intentScore,
      classification_reason: input.classificationReason,
    })
    .select(searchboxResultDTOColumns)
    .single();

  if (error) throw new Error(`Failed to insert searchbox result: ${error.message}`);
  return { result: data as unknown as SearchboxResultDTO, isNew: true };
}

export async function updateSearchboxResultStatus(
  input: UpdateSearchboxResultStatusInput,
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("searchbox_results")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.resultId)
    .eq("project_id", input.projectId);

  if (error) throw new Error(`Failed to update searchbox result status: ${error.message}`);
}

export async function markProjectSearchboxScanned(projectId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("projects")
    .update({ last_searchbox_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) throw new Error(`Failed to mark searchbox scanned: ${error.message}`);
}

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SearchboxResultDTO, UpdateSearchboxResultStatusInput } from "@/db/schemas/domain";

const searchboxResultDTOColumns = [
  "id",
  "project_id",
  "reddit_post_id",
  "google_keyword",
  "google_keywords",
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
  "lead_id",
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const { data: existing } = await sb
    .from("searchbox_results")
    .select("id, status, google_keywords")
    .eq("project_id", input.projectId)
    .eq("reddit_post_id", input.redditPostId)
    .maybeSingle();

  if (existing) {
    const currentKeywords: string[] = existing.google_keywords ?? [];
    const mergedKeywords = currentKeywords.includes(input.googleKeyword)
      ? currentKeywords
      : [...currentKeywords, input.googleKeyword];

    const { data, error } = await sb
      .from("searchbox_results")
      .update({
        google_keyword: input.googleKeyword,
        google_keywords: mergedKeywords,
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

  const { data, error } = await sb
    .from("searchbox_results")
    .insert({
      project_id: input.projectId,
      reddit_post_id: input.redditPostId,
      google_keyword: input.googleKeyword,
      google_keywords: [input.googleKeyword],
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

export async function createLeadFromSearchboxResult(
  result: SearchboxResultDTO,
  userId: string,
): Promise<string> {
  const supabase = await createSupabaseServerClient();

  // Reuse existing lead if the post was already discovered by the scraper
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("project_id", result.project_id)
    .eq("reddit_post_id", result.reddit_post_id)
    .maybeSingle();

  const leadId = existing?.id ?? await (async () => {
    const { data, error } = await supabase
      .from("leads")
      .insert({
        project_id: result.project_id,
        reddit_post_id: result.reddit_post_id,
        title: result.title,
        body: result.body,
        subreddit: result.subreddit,
        author: result.author,
        permalink: result.permalink,
        url: result.url ?? result.permalink,
        score: result.reddit_score,
        num_comments: result.reddit_num_comments,
        created_utc: result.reddit_created_utc,
        intent_score: result.intent_score,
        classification_reason: result.classification_reason,
        keywords_matched: [result.google_keyword],
        raw_data: { source: "searchbox" },
      })
      .select("id")
      .single();

    if (error) throw new Error(`Failed to create lead from searchbox result: ${error.message}`);
    return data.id;
  })();

  const { error: linkError } = await supabase
    .from("searchbox_results")
    .update({ lead_id: leadId, updated_at: new Date().toISOString() })
    .eq("id", result.id)
    .eq("project_id", result.project_id);

  if (linkError) throw new Error(`Failed to link searchbox result to lead: ${linkError.message}`);

  return leadId;
}

export async function markProjectSearchboxScanned(projectId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("projects")
    .update({ last_searchbox_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) throw new Error(`Failed to mark searchbox scanned: ${error.message}`);
}

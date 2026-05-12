import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BrandMentionDTO } from "@/db/schemas/domain";

export type UpsertBrandMentionInput = {
  projectId: string;
  redditPostId: string;
  targetType: "company" | "competitor";
  targetLabel: string;
  title: string;
  body: string | null;
  subreddit: string;
  author: string | null;
  permalink: string;
  url: string | null;
  redditScore: number;
  numComments: number;
  sentiment: "positive" | "negative" | "neutral";
  sentimentReason: string | null;
  postedAt: string | null;
  postType?: string | null;
  mentionContext?: string | null;
  responsePriority?: number | null;
  sentimentEvidence?: string | null;
  summary?: string | null;
  wrongRegion?: boolean | null;
  isComment?: boolean;
  parentPostId?: string | null;
};

const mentionColumns = `id, project_id, reddit_post_id, target_type, target_label, title, body, subreddit, author, permalink, url, reddit_score, num_comments, sentiment, sentiment_reason, post_type, mention_context, response_priority, sentiment_evidence, summary, wrong_region, posted_at, opened_at, created_at, is_comment, parent_post_id, status`;

export async function upsertBrandMention(input: UpsertBrandMentionInput): Promise<BrandMentionDTO | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("brand_mentions")
    .upsert(
      {
        project_id: input.projectId,
        reddit_post_id: input.redditPostId,
        target_type: input.targetType,
        target_label: input.targetLabel,
        title: input.title,
        body: input.body,
        subreddit: input.subreddit,
        author: input.author,
        permalink: input.permalink,
        url: input.url,
        reddit_score: input.redditScore,
        num_comments: input.numComments,
        sentiment: input.sentiment,
        sentiment_reason: input.sentimentReason,
        post_type: input.postType ?? null,
        mention_context: input.mentionContext ?? null,
        response_priority: input.responsePriority ?? null,
        sentiment_evidence: input.sentimentEvidence ?? null,
        summary: input.summary ?? null,
        wrong_region: input.wrongRegion ?? false,
        posted_at: input.postedAt,
        is_comment: input.isComment ?? false,
        parent_post_id: input.parentPostId ?? null,
      },
      {
        onConflict: "project_id,reddit_post_id,target_label",
        ignoreDuplicates: false,
      },
    )
    .select(mentionColumns)
    .single();

  if (error) {
    if (error.code === "23505") return null;
    throw new Error(`Failed to upsert brand mention: ${error.message}`);
  }

  return data as BrandMentionDTO;
}

export async function updateBrandMentionStatus(
  projectId: string,
  mentionId: string,
  status: "new" | "replied",
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("brand_mentions")
    .update({ status })
    .eq("project_id", projectId)
    .eq("id", mentionId);
  if (error) throw new Error(`Failed to update mention status: ${error.message}`);
}

export async function updateProjectLastMentionsScrapedAt(projectId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("projects")
    .update({ last_mentions_scraped_at: new Date().toISOString() })
    .eq("id", projectId);
}

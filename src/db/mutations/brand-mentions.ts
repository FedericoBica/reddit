import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
};

const mentionColumns = `id, project_id, reddit_post_id, target_type, target_label, title, body, subreddit, author, permalink, url, reddit_score, num_comments, sentiment, sentiment_reason, posted_at, created_at`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export async function upsertBrandMention(input: UpsertBrandMentionInput): Promise<BrandMentionDTO | null> {
  const supabase = createSupabaseAdminClient() as AnySupabase;

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
        posted_at: input.postedAt,
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

export async function updateProjectLastMentionsScrapedAt(projectId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("projects")
    .update({ last_mentions_scraped_at: new Date().toISOString() })
    .eq("id", projectId);
}

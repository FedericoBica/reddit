import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BrandMentionDTO, BrandMentionSentiment } from "@/db/schemas/domain";

const mentionColumns = `id, project_id, reddit_post_id, target_type, target_label, title, body, subreddit, author, permalink, url, reddit_score, num_comments, sentiment, sentiment_reason, posted_at, created_at`;

export type ListBrandMentionsInput = {
  projectId: string;
  targetType?: "company" | "competitor";
  targetLabel?: string;
  sentiment?: BrandMentionSentiment;
  limit?: number;
  offset?: number;
};

export async function listBrandMentions(input: ListBrandMentionsInput): Promise<BrandMentionDTO[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("brand_mentions")
    .select(mentionColumns)
    .eq("project_id", input.projectId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 200);

  if (input.targetType) query = query.eq("target_type", input.targetType);
  if (input.targetLabel) query = query.eq("target_label", input.targetLabel);
  if (input.sentiment) query = query.eq("sentiment", input.sentiment);
  if (input.offset) query = query.range(input.offset, input.offset + (input.limit ?? 200) - 1);

  const { data, error } = await query;

  if (error) throw new Error(`Failed to list brand mentions: ${error.message}`);

  return (data ?? []) as BrandMentionDTO[];
}

export async function getLastMentionScrapedAt(projectId: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("brand_mentions")
    .select("created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data?.created_at ?? null;
}

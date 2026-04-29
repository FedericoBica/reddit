import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BrandMentionDTO, BrandMentionSentiment } from "@/db/schemas/domain";

const mentionColumns = `id, project_id, reddit_post_id, target_type, target_label, title, body, subreddit, author, permalink, url, reddit_score, num_comments, sentiment, sentiment_reason, posted_at, opened_at, created_at`;

function withLegacyMentionCompatibility(
  mention: Omit<
    BrandMentionDTO,
    "post_type" | "mention_context" | "response_priority" | "sentiment_evidence" | "summary" | "wrong_region"
  >,
): BrandMentionDTO {
  return {
    ...mention,
    post_type: null,
    mention_context: null,
    response_priority: null,
    sentiment_evidence: null,
    summary: null,
    wrong_region: null,
  };
}

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

  return (data ?? []).map((mention) =>
    withLegacyMentionCompatibility(
      mention as Omit<
        BrandMentionDTO,
        "post_type" | "mention_context" | "response_priority" | "sentiment_evidence" | "summary" | "wrong_region"
      >,
    ),
  );
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

export async function getBrandMentionById(
  projectId: string,
  mentionId: string,
): Promise<BrandMentionDTO | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("brand_mentions")
    .select(mentionColumns)
    .eq("project_id", projectId)
    .eq("id", mentionId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load brand mention: ${error.message}`);

  return data
    ? withLegacyMentionCompatibility(
        data as Omit<
          BrandMentionDTO,
          "post_type" | "mention_context" | "response_priority" | "sentiment_evidence" | "summary" | "wrong_region"
        >,
      )
    : null;
}

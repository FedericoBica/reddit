import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { projectIdSchema, leadStatusSchema, type XPostDTO } from "@/db/schemas/domain";
import type { Json } from "@/db/schemas/database.types";

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

export async function addXKeyword(projectId: string, query: string): Promise<void> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const normalized = query.trim().replace(/\s+/g, " ");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("x_keywords")
    .upsert(
      { project_id: parsedProjectId, query: normalized, is_active: true },
      { onConflict: "project_id,query", ignoreDuplicates: false },
    );

  if (error) {
    throw new Error(`Failed to add X keyword: ${error.message}`);
  }
}

export async function updateXKeyword(projectId: string, keywordId: string, query: string): Promise<void> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const normalized = query.trim().replace(/\s+/g, " ");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("x_keywords")
    .update({ query: normalized })
    .eq("project_id", parsedProjectId)
    .eq("id", keywordId);

  if (error) {
    throw new Error(`Failed to update X keyword: ${error.message}`);
  }
}

export async function toggleXKeyword(projectId: string, keywordId: string, isActive: boolean): Promise<void> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("x_keywords")
    .update({ is_active: isActive })
    .eq("project_id", parsedProjectId)
    .eq("id", keywordId);

  if (error) {
    throw new Error(`Failed to toggle X keyword: ${error.message}`);
  }
}

export async function removeXKeyword(projectId: string, keywordId: string): Promise<void> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("x_keywords")
    .delete()
    .eq("project_id", parsedProjectId)
    .eq("id", keywordId);

  if (error) {
    throw new Error(`Failed to remove X keyword: ${error.message}`);
  }
}

type UpsertXPostInput = {
  projectId: string;
  xPostId: string;
  text: string;
  permalink: string;
  lang?: string | null;
  postedAt?: string | null;
  authorId?: string | null;
  authorUsername?: string | null;
  authorName?: string | null;
  authorVerified?: boolean | null;
  authorFollowersCount?: number | null;
  likeCount?: number | null;
  retweetCount?: number | null;
  replyCount?: number | null;
  quoteCount?: number | null;
  bookmarkCount?: number | null;
  impressionCount?: number | null;
  intentScore?: number | null;
  sentiment?: "positive" | "negative" | "neutral" | null;
  classificationReason?: string | null;
  classifierPromptVersion?: string | null;
  keywordsMatched?: string[];
  rawData?: Json;
};

export async function upsertXPost(input: UpsertXPostInput): Promise<XPostDTO> {
  const supabase = createSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("x_posts")
    .select("keywords_matched,status")
    .eq("project_id", input.projectId)
    .eq("x_post_id", input.xPostId)
    .maybeSingle();

  const mergedKeywords = Array.from(
    new Set([...(existing?.keywords_matched ?? []), ...(input.keywordsMatched ?? [])]),
  );

  const { data, error } = await supabase
    .from("x_posts")
    .upsert(
      {
        project_id: input.projectId,
        x_post_id: input.xPostId,
        text: input.text,
        permalink: input.permalink,
        lang: input.lang ?? null,
        posted_at: input.postedAt ?? null,
        author_id: input.authorId ?? null,
        author_username: input.authorUsername ?? null,
        author_name: input.authorName ?? null,
        author_verified: input.authorVerified ?? null,
        author_followers_count: input.authorFollowersCount ?? null,
        like_count: input.likeCount ?? 0,
        retweet_count: input.retweetCount ?? 0,
        reply_count: input.replyCount ?? 0,
        quote_count: input.quoteCount ?? 0,
        bookmark_count: input.bookmarkCount ?? null,
        impression_count: input.impressionCount ?? null,
        intent_score: input.intentScore ?? null,
        sentiment: input.sentiment ?? null,
        classification_reason: input.classificationReason ?? null,
        classifier_prompt_version: input.classifierPromptVersion ?? null,
        keywords_matched: mergedKeywords,
        status: existing?.status ?? "new",
        raw_data: input.rawData ?? {},
      },
      {
        onConflict: "project_id,x_post_id",
        ignoreDuplicates: false,
      },
    )
    .select(xPostColumns)
    .single();

  if (error) {
    throw new Error(`Failed to upsert X post: ${error.message}`);
  }

  return data;
}

export async function updateXPostStatus(projectId: string, postId: string, status: string): Promise<void> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const parsedStatus = leadStatusSchema.parse(status);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("x_posts")
    .update({ status: parsedStatus })
    .eq("project_id", parsedProjectId)
    .eq("id", postId);

  if (error) {
    throw new Error(`Failed to update X post status: ${error.message}`);
  }
}

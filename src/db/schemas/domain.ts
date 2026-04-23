import { z } from "zod";
import type { Enums, Json, Tables } from "./database.types";

export const projectIdSchema = z.string().uuid();
export const leadIdSchema = z.string().uuid();

export const keywordTypeSchema = z.enum([
  "custom",
  "ai_suggested",
  "competitor",
] satisfies [Enums<"keyword_type">, ...Enums<"keyword_type">[]]);

export const intentCategorySchema = z.enum([
  "informational",
  "comparative",
  "transactional",
] satisfies [Enums<"intent_category">, ...Enums<"intent_category">[]]);

export const projectOnboardingStatusSchema = z.enum([
  "needs_suggestions",
  "suggestions_pending",
  "suggestions_ready",
  "suggestions_failed",
  "completed",
] satisfies [
  Enums<"project_onboarding_status">,
  ...Enums<"project_onboarding_status">[],
]);

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  websiteUrl: z.string().url().max(500).optional().nullable(),
  valueProposition: z.string().trim().max(2_000).optional().nullable(),
  tone: z.string().trim().max(2_000).optional().nullable(),
  region: z.string().trim().max(80).optional().nullable(),
  currencyCode: z.string().trim().length(3).toUpperCase().default("USD"),
  primaryLanguage: z.string().trim().min(2).max(20).default("en"),
  secondaryLanguage: z.string().trim().min(2).max(20).optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const saveProjectOnboardingSchema = z.object({
  projectId: projectIdSchema,
  acceptedKeywordSuggestionIds: z.array(z.string().uuid()).default([]),
  acceptedSubredditSuggestionIds: z.array(z.string().uuid()).default([]),
  customKeywords: z.array(z.string().trim().min(1).max(120)).default([]),
  customSubreddits: z.array(z.string().trim().min(1).max(80)).default([]),
});

export const leadStatusSchema = z.enum([
  "new",
  "reviewing",
  "replied",
  "won",
  "lost",
  "irrelevant",
] satisfies [Enums<"lead_status">, ...Enums<"lead_status">[]]);

export const replyGenerationStatusSchema = z.enum([
  "idle",
  "generating",
  "ready",
  "failed",
] satisfies [Enums<"reply_generation_status">, ...Enums<"reply_generation_status">[]]);

export const replyStyleSchema = z.enum([
  "engaging",
  "direct",
  "balanced",
] satisfies [Exclude<Enums<"reply_style">, "custom">, ...Exclude<Enums<"reply_style">, "custom">[]]);

export const listLeadsInputSchema = z.object({
  projectId: projectIdSchema,
  status: leadStatusSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50),
  page: z.number().int().min(0).default(0),
  offset: z.number().int().min(0).optional(),
});

export const createLeadSchema = z.object({
  projectId: projectIdSchema,
  redditPostId: z.string().trim().min(1).max(128),
  redditFullname: z.string().trim().max(128).optional().nullable(),
  title: z.string().trim().min(1).max(500),
  body: z.string().optional().nullable(),
  subreddit: z.string().trim().min(1).max(80),
  author: z.string().trim().max(80).optional().nullable(),
  permalink: z.string().trim().min(1).max(1_000),
  url: z.string().trim().max(1_000).optional().nullable(),
  createdUtc: z.string().datetime().optional().nullable(),
  score: z.number().int().optional().nullable(),
  numComments: z.number().int().optional().nullable(),
  intentScore: z.number().int().min(0).max(100).optional().nullable(),
  intentType: z.enum(["competitor_comparison", "active_buying", "pain_expression", "existing_user", "low_intent"]).optional().nullable(),
  regionScore: z.number().int().min(0).max(10).optional().nullable(),
  sentiment: z.enum(["positive", "negative", "neutral"]).optional().nullable(),
  classificationReason: z.string().max(2_000).optional().nullable(),
  classifierPromptVersion: z.string().trim().max(80).optional().nullable(),
  keywordsMatched: z.array(z.string()).default([]),
  rawData: z.custom<Json>().default({}),
});

export const updateLeadStatusSchema = z.object({
  leadId: leadIdSchema,
  projectId: projectIdSchema,
  status: leadStatusSchema,
  wonValue: z.number().nonnegative().optional().nullable(),
  lostReason: z.string().trim().max(500).optional().nullable(),
});

export type Project = Tables<"projects">;
export type Lead = Tables<"leads">;
export type LeadReply = Tables<"lead_replies">;
export type ProjectKeywordSuggestion = Tables<"project_keyword_suggestions">;
export type ProjectSubredditSuggestion = Tables<"project_subreddit_suggestions">;
export type ProjectScrapeRun = Tables<"project_scrape_runs">;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type SaveProjectOnboardingInput = z.infer<typeof saveProjectOnboardingSchema>;
export type ListLeadsInput = z.infer<typeof listLeadsInputSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;

export const searchboxResultStatusSchema = z.enum(["new", "replied", "dismissed"]);

export const updateSearchboxResultStatusSchema = z.object({
  resultId: z.string().uuid(),
  projectId: projectIdSchema,
  status: searchboxResultStatusSchema,
});

export type SearchboxResult = Tables<"searchbox_results">;
export type SearchboxResultStatus = z.infer<typeof searchboxResultStatusSchema>;
export type UpdateSearchboxResultStatusInput = z.infer<typeof updateSearchboxResultStatusSchema>;

export type SearchboxResultDTO = Pick<
  SearchboxResult,
  | "id"
  | "project_id"
  | "reddit_post_id"
  | "google_keyword"
  | "google_rank"
  | "title"
  | "body"
  | "subreddit"
  | "author"
  | "permalink"
  | "url"
  | "reddit_score"
  | "reddit_num_comments"
  | "reddit_created_utc"
  | "intent_score"
  | "classification_reason"
  | "status"
  | "lead_id"
  | "first_seen_at"
  | "last_seen_at"
  | "created_at"
> & {
  google_keywords: string[];
};

export type Keyword = Tables<"keywords">;
export type Subreddit = Tables<"subreddits">;

export type KeywordDTO = Pick<
  Keyword,
  "id" | "project_id" | "term" | "type" | "intent_category" | "is_active" | "created_at" | "updated_at"
>;

export type SubredditDTO = Pick<
  Subreddit,
  "id" | "project_id" | "name" | "type" | "is_active" | "is_regional" | "last_scanned_at" | "avg_daily_posts" | "created_at" | "updated_at"
>;

export type ProjectDTO = Pick<
  Project,
  | "id"
  | "name"
  | "website_url"
  | "value_proposition"
  | "tone"
  | "region"
  | "currency_code"
  | "primary_language"
  | "secondary_language"
  | "status"
  | "onboarding_status"
  | "onboarding_completed_at"
  | "suggestions_error"
  | "last_scraped_at"
  | "last_searchbox_at"
  | "last_mentions_scraped_at"
  | "scrape_fail_count"
  | "scrape_backoff_until"
  | "last_scrape_error"
  | "created_at"
  | "updated_at"
>;

export type ProjectScrapeRunDTO = Pick<
  ProjectScrapeRun,
  | "id"
  | "project_id"
  | "run_id"
  | "status"
  | "started_at"
  | "completed_at"
  | "subreddits_count"
  | "posts_seen"
  | "leads_created"
  | "duplicates_skipped"
  | "error_message"
  | "metadata"
  | "created_at"
>;

export type ProjectKeywordSuggestionDTO = Pick<
  ProjectKeywordSuggestion,
  "id" | "project_id" | "term" | "intent_category" | "rationale" | "created_at"
>;

export type ProjectSubredditSuggestionDTO = Pick<
  ProjectSubredditSuggestion,
  "id" | "project_id" | "name" | "is_regional" | "rationale" | "created_at"
>;

export type LeadDTO = Pick<
  Lead,
  | "id"
  | "project_id"
  | "reddit_post_id"
  | "title"
  | "body"
  | "subreddit"
  | "author"
  | "permalink"
  | "url"
  | "created_utc"
  | "score"
  | "num_comments"
  | "intent_score"
  | "intent_type"
  | "region_score"
  | "sentiment"
  | "classification_reason"
  | "classifier_prompt_version"
  | "keywords_matched"
  | "status"
  | "snoozed_until"
  | "opened_at"
  | "replied_at"
  | "reply_generation_status"
  | "reply_generation_error"
  | "reply_generation_requested_at"
  | "reply_generation_completed_at"
  | "won_value"
  | "lost_reason"
  | "created_at"
  | "updated_at"
>;

export type ReplyStyle = z.infer<typeof replyStyleSchema>;

// ─── Brand Mentions ───────────────────────────────────────────

export const brandMentionSentimentSchema = z.enum(["positive", "negative", "neutral"]);
export const brandMentionTargetTypeSchema = z.enum(["company", "competitor"]);

export type BrandMentionSentiment = z.infer<typeof brandMentionSentimentSchema>;
export type BrandMentionTargetType = z.infer<typeof brandMentionTargetTypeSchema>;

export type BrandMentionDTO = {
  id: string;
  project_id: string;
  reddit_post_id: string;
  target_type: BrandMentionTargetType;
  target_label: string;
  title: string;
  body: string | null;
  subreddit: string;
  author: string | null;
  permalink: string;
  url: string | null;
  reddit_score: number;
  num_comments: number;
  sentiment: BrandMentionSentiment;
  sentiment_reason: string | null;
  posted_at: string | null;
  created_at: string;
};

export type LeadReplyDTO = Pick<
  LeadReply,
  | "id"
  | "lead_id"
  | "project_id"
  | "created_by"
  | "style"
  | "content"
  | "prompt_version"
  | "model"
  | "input_tokens"
  | "output_tokens"
  | "cost_usd"
  | "was_used"
  | "used_at"
  | "created_at"
>;

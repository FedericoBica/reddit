import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { leadIdSchema, projectIdSchema, type LeadDTO, type ProjectDTO, type ReplyStyle } from "@/db/schemas/domain";

const REPLY_PROMPT_VERSION = "lead_reply_v1";

const replyResponseSchema = z.object({
  content: z.string().trim().min(40).max(1_500),
});

type ReplyGenerationContext = {
  project: ProjectDTO;
  lead: LeadDTO;
};

export type GeneratedLeadReplyVariant = {
  style: ReplyStyle;
  content: string;
  promptVersion: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

const projectColumns = `
  id,
  name,
  website_url,
  value_proposition,
  tone,
  region,
  currency_code,
  primary_language,
  secondary_language,
  status,
  onboarding_status,
  onboarding_completed_at,
  suggestions_error,
  last_scraped_at,
  scrape_fail_count,
  scrape_backoff_until,
  last_scrape_error,
  created_at,
  updated_at
`;

const leadColumns = `
  id,
  project_id,
  reddit_post_id,
  title,
  body,
  subreddit,
  author,
  permalink,
  url,
  created_utc,
  score,
  num_comments,
  intent_score,
  region_score,
  sentiment,
  classification_reason,
  classifier_prompt_version,
  keywords_matched,
  status,
  snoozed_until,
  opened_at,
  replied_at,
  reply_generation_status,
  reply_generation_error,
  reply_generation_requested_at,
  reply_generation_completed_at,
  won_value,
  lost_reason,
  created_at,
  updated_at
`;

export async function getReplyGenerationContext(
  projectId: string,
  leadId: string,
): Promise<ReplyGenerationContext> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const parsedLeadId = leadIdSchema.parse(leadId);
  const supabase = createSupabaseAdminClient();

  const [{ data: project, error: projectError }, { data: lead, error: leadError }] = await Promise.all([
    supabase.from("projects").select(projectColumns).eq("id", parsedProjectId).single(),
    supabase
      .from("leads")
      .select(leadColumns)
      .eq("project_id", parsedProjectId)
      .eq("id", parsedLeadId)
      .single(),
  ]);

  if (projectError) {
    throw new Error(`Failed to load project for reply generation: ${projectError.message}`);
  }

  if (leadError) {
    throw new Error(`Failed to load lead for reply generation: ${leadError.message}`);
  }

  return { project, lead };
}

export async function generateLeadReplyVariant(
  context: ReplyGenerationContext,
  style: ReplyStyle,
): Promise<GeneratedLeadReplyVariant> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_REPLY_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const temperature = Number(process.env.OPENAI_REPLY_TEMPERATURE ?? "0.55");
  const timeoutMs = Number(process.env.OPENAI_REPLY_TIMEOUT_MS ?? "30000");
  const client = new OpenAI({ apiKey, timeout: timeoutMs });
  const response = await client.responses.parse(
    {
      model,
      temperature,
      instructions: [
        "You write helpful Reddit replies for a lead monitoring product.",
        "Write as a human participant, not as an ad. Do not mention that you are an AI.",
        "Be specific to the post. Avoid hype, spam, aggressive competitor attacks, and generic CTAs.",
        "Do not invent product facts that are not present in the project context.",
        styleInstruction(style),
      ].join("\n"),
      input: [
        `Reply style: ${style}`,
        `Project name: ${context.project.name}`,
        `Project website: ${context.project.website_url ?? "not provided"}`,
        `Project value proposition: ${context.project.value_proposition ?? "not provided"}`,
        `Project tone: ${context.project.tone ?? "not provided"}`,
        `Project region: ${context.project.region ?? "global / not provided"}`,
        `Primary language: ${context.project.primary_language}`,
        `Secondary language: ${context.project.secondary_language ?? "not provided"}`,
        `Subreddit: r/${context.lead.subreddit}`,
        `Lead author: ${context.lead.author ? `u/${context.lead.author}` : "unknown"}`,
        `Lead title: ${context.lead.title}`,
        `Lead body: ${context.lead.body || "No body provided."}`,
        `Matched keywords: ${context.lead.keywords_matched.join(", ") || "none"}`,
        `Classification reason for internal context only: ${
          context.lead.classification_reason ?? "not provided"
        }`,
      ].join("\n"),
      max_output_tokens: 900,
      text: {
        format: zodTextFormat(replyResponseSchema, `lead_reply_${style}`),
      },
    },
    { timeout: timeoutMs },
  );

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error(`OpenAI returned no parsed ${style} reply`);
  }

  return {
    style,
    content: parsed.content.trim(),
    promptVersion: REPLY_PROMPT_VERSION,
    model,
    inputTokens: response.usage?.input_tokens ?? null,
    outputTokens: response.usage?.output_tokens ?? null,
  };
}

function styleInstruction(style: ReplyStyle) {
  if (style === "direct") {
    return "Direct style: concise, practical, and explicit about the relevant pain point and fit.";
  }

  if (style === "balanced") {
    return "Balanced style: helpful first, then lightly connect the product context where it naturally fits.";
  }

  return "Engaging style: conversational, curious, and value-first without directly pitching.";
}

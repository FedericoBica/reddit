import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { Enums } from "@/db/schemas/database.types";
import type { RedditPost } from "@/modules/discovery/reddit/types";

export const LEAD_CLASSIFIER_PROMPT_VERSION = "v1";

const leadClassificationSchema = z.object({
  intent_score: z.number().int().min(0).max(100),
  region_score: z.number().int().min(0).max(10),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  classification_reason: z.string().trim().min(1).max(300),
});

type ClassifyLeadInput = {
  project: {
    name: string;
    website_url: string | null;
    value_proposition: string | null;
    tone: string | null;
    region: string | null;
    primary_language: string;
  };
  post: RedditPost;
  keywordsMatched: string[];
};

export type LeadClassification = {
  intentScore: number;
  regionScore: number;
  sentiment: Enums<"lead_sentiment">;
  classificationReason: string;
  promptVersion: typeof LEAD_CLASSIFIER_PROMPT_VERSION;
  usage: {
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
  };
};

export async function classifyLeadCandidate(
  input: ClassifyLeadInput,
): Promise<LeadClassification> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_LEAD_CLASSIFIER_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const temperature = Number(process.env.OPENAI_LEAD_CLASSIFIER_TEMPERATURE ?? "0.2");
  const timeoutMs = Number(process.env.OPENAI_LEAD_CLASSIFIER_TIMEOUT_MS ?? "25000");
  const client = new OpenAI({ apiKey, timeout: timeoutMs });
  const response = await client.responses.parse(
    {
      model,
      temperature,
      instructions: [
        "You classify whether a Reddit post is a real commercial lead for a SaaS product.",
        "Score high intent when the author expresses a problem, asks for recommendations, compares alternatives, shows frustration with an existing tool, or signals buying/replacement intent.",
        "Score low intent for generic discussion, news, memes, tutorials without a stated need, job posts, spam, or content unrelated to the product.",
        "Use region_score to capture fit with the project's region, market, language, or locality. If region is not relevant or unknown, use a neutral score.",
        "Keep classification_reason short, concrete, and useful for a human reviewer.",
      ].join("\n"),
      input: [
        `Prompt version: ${LEAD_CLASSIFIER_PROMPT_VERSION}`,
        `Project name: ${input.project.name}`,
        `Website URL: ${input.project.website_url ?? "not provided"}`,
        `Value proposition: ${input.project.value_proposition ?? "not provided"}`,
        `Tone: ${input.project.tone ?? "not provided"}`,
        `Region: ${input.project.region ?? "not provided / global"}`,
        `Primary language: ${input.project.primary_language}`,
        `Matched keywords: ${input.keywordsMatched.join(", ")}`,
        `Subreddit: r/${input.post.subreddit}`,
        `Post title: ${input.post.title}`,
        `Post body: ${input.post.body ?? ""}`,
      ].join("\n"),
      max_output_tokens: 500,
      text: {
        format: zodTextFormat(leadClassificationSchema, "lead_classification"),
      },
    },
    { timeout: timeoutMs },
  );

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("OpenAI returned no parsed lead classification");
  }

  return {
    intentScore: parsed.intent_score,
    regionScore: parsed.region_score,
    sentiment: parsed.sentiment,
    classificationReason: parsed.classification_reason,
    promptVersion: LEAD_CLASSIFIER_PROMPT_VERSION,
    usage: {
      model,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    },
  };
}

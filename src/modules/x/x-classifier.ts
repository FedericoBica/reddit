import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { Enums } from "@/db/schemas/database.types";

export const X_CLASSIFIER_PROMPT_VERSION = "v1";

const xClassificationSchema = z.object({
  intent_score: z.number().int().min(0).max(100),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  classification_reason: z.string().trim().min(1).max(240),
});

type ClassifyXPostInput = {
  project: {
    name: string;
    website_url: string | null;
    value_proposition: string | null;
    region: string | null;
    primary_language: string;
  };
  post: {
    text: string;
    authorUsername: string | null;
    authorName: string | null;
    lang: string | null;
    likeCount: number | null;
    retweetCount: number | null;
    replyCount: number | null;
    authorVerified: boolean | null;
  };
  matchedQueries: string[];
};

export type XPostClassification = {
  intentScore: number;
  sentiment: Enums<"lead_sentiment">;
  classificationReason: string;
  promptVersion: typeof X_CLASSIFIER_PROMPT_VERSION;
};

function buildSystemPrompt() {
  return `
You evaluate whether a short X post is a strong lead for a SaaS team to notice and possibly engage with.

Score based on relevance, not just purchase intent.

High scores:
- Explicit pain, comparison, request for recommendations, or active workflow discussion
- Clear overlap with the product category
- A reply or follow-up would feel natural

Low scores:
- News, memes, stock talk, vague chatter, job posts, or incidental keyword matches
- Promotional posts from vendors
- Content with no practical problem or workflow discussion

Return:
- intent_score from 0 to 100
- sentiment
- classification_reason using this format: "[signal observed] -> [why it is or is not a good X lead]"
Keep the reason concrete and under 240 chars.
`.trim();
}

function buildUserPrompt(input: ClassifyXPostInput) {
  return [
    `Product: ${input.project.name}`,
    `Website: ${input.project.website_url ?? "not provided"}`,
    `Value proposition: ${input.project.value_proposition ?? "not provided"}`,
    `Region: ${input.project.region ?? "global / not specified"}`,
    `Primary language: ${input.project.primary_language}`,
    `Matched X queries: ${input.matchedQueries.join(", ")}`,
    `Author: ${input.post.authorName ?? input.post.authorUsername ?? "unknown"}`,
    `Verified: ${input.post.authorVerified ? "yes" : "no"}`,
    `Lang: ${input.post.lang ?? "unknown"}`,
    `Likes: ${input.post.likeCount ?? 0}`,
    `Retweets: ${input.post.retweetCount ?? 0}`,
    `Replies: ${input.post.replyCount ?? 0}`,
    "Post text:",
    input.post.text,
  ].join("\n");
}

export async function classifyXPostCandidate(input: ClassifyXPostInput): Promise<XPostClassification> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for X classifier.");
  }

  const client = new OpenAI({ apiKey });
  const response = await client.responses.parse({
    model: "gpt-4.1-mini",
    input: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(input) },
    ],
    text: {
      format: zodTextFormat(xClassificationSchema, "x_post_classification"),
    },
  });

  const parsed = response.output_parsed;
  if (!parsed) {
    throw new Error("X classifier returned no parsed output.");
  }

  return {
    intentScore: parsed.intent_score,
    sentiment: parsed.sentiment,
    classificationReason: parsed.classification_reason,
    promptVersion: X_CLASSIFIER_PROMPT_VERSION,
  };
}

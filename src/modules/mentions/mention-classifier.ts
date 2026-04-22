import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const classificationSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  reason: z.string().trim().min(1).max(200),
});

export type MentionClassification = {
  sentiment: "positive" | "negative" | "neutral";
  reason: string;
};

export async function classifyMentionSentiment(input: {
  targetLabel: string;
  title: string;
  body: string | null;
}): Promise<MentionClassification> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const client = new OpenAI({ apiKey });

  const content = [input.title, input.body].filter(Boolean).join("\n\n").slice(0, 1500);

  const response = await client.responses.parse({
    model,
    temperature: 0,
    instructions: `You classify the sentiment of Reddit posts that mention a brand or company.

Positive: the post praises, recommends, or expresses satisfaction with the mentioned entity.
Negative: the post criticizes, complains, warns against, or expresses dissatisfaction.
Neutral: factual mention, comparison without clear bias, or asking for information.

Return only the sentiment label and a brief one-sentence reason.`,
    input: `Brand/company being mentioned: "${input.targetLabel}"\n\nReddit post:\n${content}`,
    max_output_tokens: 150,
    text: {
      format: zodTextFormat(classificationSchema, "classification"),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    return { sentiment: "neutral", reason: "Could not classify." };
  }

  return { sentiment: parsed.sentiment, reason: parsed.reason };
}

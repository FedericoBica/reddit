import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const mentionClassificationSchema = z.object({
  post_type: z.enum(["question", "roundup", "complaint", "comparison", "case_study", "discussion", "other"]),
  mention_context: z.enum(["recommended", "criticized", "compared", "neutral_mention", "used_by_author", "leaving"]),
  response_priority: z.number().int().min(1).max(10),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  sentiment_evidence: z.string().trim().max(200),
  region_score: z.number().int().min(0).max(10),
  wrong_region: z.boolean(),
  summary: z.string().trim().max(300),
});

export type MentionClassification = {
  postType: z.infer<typeof mentionClassificationSchema>["post_type"];
  mentionContext: z.infer<typeof mentionClassificationSchema>["mention_context"];
  responsePriority: number;
  sentiment: "positive" | "negative" | "neutral";
  sentimentEvidence: string;
  regionScore: number;
  wrongRegion: boolean;
  summary: string;
  sentimentReason: string;
};

function buildSystemPrompt(): string {
  return `
You are a brand monitoring AI. Your job is to analyze Reddit posts that mention a specific brand or company
and extract structured intelligence useful for the brand's team to decide how to respond.

You will be told whether the mentioned entity is:
  - "company": the user's own brand — focus on brand health, reputation, churn signals
  - "competitor": a competitor brand — focus on competitor weaknesses and user frustration opportunities

═══════════════════════════════════════════════
STEP 1 — POST TYPE
═══════════════════════════════════════════════

Classify the overall nature of the post:

"question"    — Author asks for help, advice, or recommendations involving the brand
"complaint"   — Author expresses frustration, failure, or dissatisfaction (with the brand or a situation)
"comparison"  — Author explicitly compares 2+ tools or brands
"roundup"     — Structured list/review of multiple tools, no personal stake
"case_study"  — Author shares a personal experience or outcome using a tool
"discussion"  — Open conversation, no specific question or complaint
"other"       — Anything that doesn't fit the above

═══════════════════════════════════════════════
STEP 2 — MENTION CONTEXT
═══════════════════════════════════════════════

How is the monitored brand mentioned in the post?

"recommended"     — Author praises or recommends the brand ("X is great", "I love X", "use X")
"criticized"      — Author expresses frustration, complains, or warns against the brand
"leaving"         — Author explicitly says they are switching away or cancelling — HIGHEST PRIORITY
"used_by_author"  — Author mentions they currently use or have used the brand (neutral)
"compared"        — Brand is mentioned as part of a comparison without clear positive/negative framing
"neutral_mention" — Brand appears incidentally with no sentiment or context

═══════════════════════════════════════════════
STEP 3 — RESPONSE PRIORITY (1–10)
═══════════════════════════════════════════════

How urgently should the brand team respond to this post?

For "company" mentions:
  10  — Author is actively leaving / cancelling ("I'm cancelling my subscription", "moving away from X")
  8–9 — Author is frustrated and seeking alternatives ("X keeps crashing, need something else")
  6–7 — Author has a complaint or question that a reply could address ("X doesn't support Y")
  4–5 — Neutral mention or comparison where a reply could add value
  2–3 — Positive mention, no response urgency
  1   — Incidental or irrelevant mention

For "competitor" mentions:
  10  — Author is leaving the competitor and looking for alternatives — direct conversion opportunity
  8–9 — Author is frustrated with the competitor, not yet looking but open
  6–7 — Author compares competitor unfavorably vs others
  4–5 — Neutral comparison including competitor
  2–3 — Author recommends competitor (low opportunity, monitor only)
  1   — Incidental mention, no opportunity

Signals that INCREASE priority:
  + Author explicitly asks for alternatives (+2)
  + Author mentions switching, cancelling, or leaving (+3)
  + Author states a specific budget or timeline (+1)
  + Post has high engagement (many comments) (+1)

═══════════════════════════════════════════════
STEP 4 — SENTIMENT
═══════════════════════════════════════════════

Overall sentiment of how the brand is discussed:
  "positive"  — praised, recommended, viewed favorably
  "negative"  — criticized, complained about, warned against
  "neutral"   — factual mention, balanced comparison, no clear valence

sentiment_evidence: the exact phrase (max 150 chars) that best captures the sentiment toward the brand.

═══════════════════════════════════════════════
STEP 5 — REGION
═══════════════════════════════════════════════

region_score (1–10): How likely is this post from the configured user region/country?
  10  — Multiple strong local signals (currency + slang + local institution)
  7–9 — Clear regional signals (local slang or institutions)
  4–6 — Ambiguous (some regional words, could be any country)
  1–3 — No regional signals or signals from a different region
  0   — Signals clearly indicate a DIFFERENT country → set wrong_region: true

wrong_region: true only when signals clearly point to a different country than configured.

═══════════════════════════════════════════════
STEP 6 — SUMMARY
═══════════════════════════════════════════════

Write 1–2 sentences a brand manager can read in 5 seconds.
State: WHO is posting, WHAT they said about the brand, and WHY it matters (or doesn't).

For company mentions: focus on brand health signal and whether a response is needed.
For competitor mentions: focus on the opportunity (are they leaving? frustrated? comparing?).

BAD: "The post mentions the brand in a negative context."
GOOD: "A user says they're cancelling their subscription after a billing issue — direct churn risk, high-priority response opportunity."
GOOD: "Competitor user frustrated with slow support, asking for alternatives — prime outreach moment."
`.trim();
}

function buildUserPrompt(input: {
  targetLabel: string;
  targetType: "company" | "competitor";
  valueProposition: string | null;
  region: string | null;
  subreddit: string;
  title: string;
  body: string | null;
}): string {
  const content = [input.title, input.body].filter(Boolean).join("\n\n").slice(0, 1500);
  const lines: string[] = [];

  lines.push("── MONITORED ENTITY ──");
  lines.push(`Label: "${input.targetLabel}"`);
  lines.push(`Type: ${input.targetType} (${input.targetType === "company" ? "your own brand" : "a competitor brand"})`);
  if (input.valueProposition) lines.push(`Value proposition: ${input.valueProposition}`);
  if (input.region) lines.push(`User region: ${input.region}`);

  lines.push("\n── REDDIT POST ──");
  lines.push(`Subreddit: r/${input.subreddit}`);
  lines.push(`Content:\n${content}`);

  lines.push("\n── YOUR TASK ──");
  lines.push("Classify the mention using the rubric in the system prompt. Be specific in the summary — avoid generic observations.");

  return lines.join("\n");
}

export async function classifyMention(input: {
  targetLabel: string;
  targetType: "company" | "competitor";
  valueProposition: string | null;
  region: string | null;
  subreddit: string;
  title: string;
  body: string | null;
}): Promise<MentionClassification> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const client = new OpenAI({ apiKey, timeout: 25_000 });

  const response = await client.responses.parse({
    model,
    temperature: 0,
    instructions: buildSystemPrompt(),
    input: buildUserPrompt(input),
    max_output_tokens: 400,
    text: { format: zodTextFormat(mentionClassificationSchema, "mention_classification") },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    return {
      postType: "other",
      mentionContext: "neutral_mention",
      responsePriority: 1,
      sentiment: "neutral",
      sentimentEvidence: "",
      regionScore: 5,
      wrongRegion: false,
      summary: "Could not classify.",
      sentimentReason: "Could not classify.",
    };
  }

  return {
    postType: parsed.post_type,
    mentionContext: parsed.mention_context,
    responsePriority: parsed.response_priority,
    sentiment: parsed.sentiment,
    sentimentEvidence: parsed.sentiment_evidence,
    regionScore: parsed.region_score,
    wrongRegion: parsed.wrong_region,
    summary: parsed.summary,
    sentimentReason: parsed.summary,
  };
}

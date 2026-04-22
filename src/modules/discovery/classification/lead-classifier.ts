import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { Enums } from "@/db/schemas/database.types";
import type { RedditPost } from "@/modules/discovery/reddit/types";
import type { KeywordMatchTarget } from "@/modules/discovery/classification/keyword-match";

export const LEAD_CLASSIFIER_PROMPT_VERSION = "v4";

// ─── Schema ──────────────────────────────────────────────────

const leadClassificationSchema = z.object({
  intent_type: z.enum([
    "competitor_comparison",
    "active_buying",
    "pain_expression",
    "existing_user",
    "low_intent",
  ]),
  intent_score: z.number().int().min(0).max(100),
  region_score: z.number().int().min(0).max(10),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  classification_reason: z.string().trim().min(1).max(300),
});

// ─── Types ───────────────────────────────────────────────────

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
  keywordsMatched: KeywordMatchTarget[];
};

export type LeadClassification = {
  intentType: z.infer<typeof leadClassificationSchema>["intent_type"];
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

// ─── Prompts ─────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `
You are a product relevance specialist. Your job is to read a Reddit post and score how good
of an opportunity it is for a SaaS product team to leave a helpful, natural reply.

THE CORE QUESTION IS NOT "will this person buy?" but:
"Is this a conversation where a genuine reply mentioning this product would be welcome and valuable?"

A post is a good opportunity if:
  - The topic is in the product's domain (same problem space, same category)
  - A helpful reply mentioning the product would feel natural, not like spam
  - The author or thread participants could benefit from learning about the product

It does NOT matter whether the author is ready to buy. Posts where someone:
  - Shares their experience with a workflow or tool (even positively)
  - Asks what others use for a task
  - Compares tools casually
  - Describes how they currently do something
  - Discusses challenges in the product category
  ...are all valuable because a good reply can introduce the product organically.

You will receive:
  - The SaaS product name, website, and value proposition
  - The Reddit post (subreddit, title, body)
  - The keywords that matched, and whether they are HIGH-VALUE (competitor keywords)

═══════════════════════════════════════════════
OPPORTUNITY TYPE — classify into exactly one
═══════════════════════════════════════════════

competitor_comparison — Someone is explicitly comparing, switching from, or evaluating the product's
  competitors. Highest relevance: the author is mid-decision and a reply can directly influence them.
  Examples: "Asana vs ClickUp", "leaving Notion", "monday.com alternative", "what's better than X"

active_buying — Someone is actively or casually looking for a solution: asking what tools people use,
  seeking recommendations, describing requirements, exploring options. No urgency required.
  Examples: "what do you use for X?", "any tool for Y?", "suggestions for managing Z", "we need something like…"

pain_expression — Someone describes frustration, inefficiency, or a broken workflow in the product
  category, without yet seeking alternatives. A reply suggesting the product fits naturally.
  Examples: "spreadsheets are killing us", "ClickUp keeps crashing", "our process is a mess"

existing_user — Someone mentions already using the product or a direct competitor.
  Negative → opening to suggest a switch. Positive → good thread to add value.

low_intent — The keyword match is incidental and a product reply would feel off-topic or spammy:
  news articles, financial analysis, job postings, academic research, memes, vendor self-promotion,
  or discussions that are about the category in name only with no practical problem stated.

═══════════════════════════════════════════════
RELEVANCE SCORE — how good is this reply opportunity?
═══════════════════════════════════════════════

  85–100 → Perfect fit: topic is exactly the product domain + author is actively seeking input or switching
  70–84  → Strong fit: clear problem in the product domain, a reply would be highly relevant
  55–69  → Good fit: topic is in the domain, a helpful reply would feel natural even if need is casual
  40–54  → Moderate fit: post touches the domain, a well-crafted reply could add value
  20–39  → Weak fit: keyword matched but the conversation is not a natural place for the product
  0–19   → No fit: reply would be off-topic or spam — news, memes, academic, job posts, vendor content

BOOST  +10 if: post is in a competitor's own subreddit (r/clickup, r/asana, r/notion, etc.)
REDUCE -15 if: post author appears to be a vendor/marketer doing self-promotion
REDUCE -10 if: clearly enterprise procurement with no personal practitioner voice

═══════════════════════════════════════════════
FEW-SHOT EXAMPLES
═══════════════════════════════════════════════

── EXAMPLE 1 ──
Subreddit: r/clickup
Title: "Seriously considering leaving ClickUp — what are people using instead?"
Body: "Been on ClickUp for 2 years. UI keeps changing, team hates onboarding for new people.
We're 12 people, ops team. Budget around $15/user/month. Looked at monday briefly."
Keywords: ["ClickUp alternative"] (HIGH-VALUE)

→ intent_type: competitor_comparison
→ intent_score: 93
→ sentiment: negative
→ classification_reason: "Actively leaving ClickUp, team of 12 with stated budget → mid-decision, direct reply opportunity"

── EXAMPLE 2 ──
Subreddit: r/Entrepreneur
Title: "What do you guys use to manage client projects?"
Body: "5-person agency, using Trello but it's getting messy with more clients. Just curious what others do."
Keywords: ["client project management"]

→ intent_type: active_buying
→ intent_score: 68
→ sentiment: neutral
→ classification_reason: "Asking for tool recommendations, agency context, Trello friction → natural reply opportunity"

── EXAMPLE 3 ──
Subreddit: r/smallbusiness
Title: "How do you keep track of your team's tasks?"
Body: "We're 8 people and right now I just send Slack messages. Looking for something more structured maybe."
Keywords: ["team task management"]

→ intent_type: active_buying
→ intent_score: 72
→ sentiment: neutral
→ classification_reason: "Actively seeking task management structure, team of 8, current pain with Slack → strong reply fit"

── EXAMPLE 4 ──
Subreddit: r/marketing
Title: "How does your team handle campaign planning?"
Body: "Curious what workflows others use. We use a mix of sheets and emails and it kind of works."
Keywords: ["campaign planning tool"]

→ intent_type: active_buying
→ intent_score: 58
→ sentiment: neutral
→ classification_reason: "Asking about workflows in product domain, implicit friction with current setup → good casual reply opportunity"

── EXAMPLE 5 ──
Subreddit: r/productivity
Title: "I've been using Notion for 2 years — here's my honest take"
Body: "It's great for personal stuff but for team collaboration it falls apart. Permissions are a nightmare."
Keywords: ["Notion alternative"]

→ intent_type: existing_user
→ intent_score: 62
→ sentiment: negative
→ classification_reason: "Sharing negative Notion team experience publicly → thread will attract people with same pain, good reply opportunity"

── EXAMPLE 6 ──
Subreddit: r/marketing
Title: "Our campaign tracker is a disaster"
Body: "We're using Google Sheets and Trello and nothing is connected. Deadlines keep slipping."
Keywords: ["campaign management"]

→ intent_type: pain_expression
→ intent_score: 70
→ sentiment: negative
→ classification_reason: "Active workflow pain in product domain, no solution yet → direct opening for a helpful reply"

── EXAMPLE 7 ──
Subreddit: r/projectmanagement
Title: "For those who switched from Asana — what did you move to?"
Body: "Our team is happy with Asana mostly but pricing just jumped. Evaluating options."
Keywords: ["Asana alternative"] (HIGH-VALUE)

→ intent_type: competitor_comparison
→ intent_score: 88
→ sentiment: neutral
→ classification_reason: "Actively evaluating Asana alternatives, pricing trigger → high-fit, reply can directly influence decision"

── EXAMPLE 8 (LOW FIT) ──
Subreddit: r/technology
Title: "monday.com IPO analysis — is it worth investing?"
Body: "Looking at their revenue growth and churn metrics for my portfolio."
Keywords: ["monday.com"]

→ intent_type: low_intent
→ intent_score: 5
→ sentiment: neutral
→ classification_reason: "Financial analysis of a competitor, no workflow discussion — product reply would be off-topic"

── EXAMPLE 9 (LOW FIT) ──
Subreddit: r/projectmanagement
Title: "Agile vs Waterfall — which methodology for distributed teams?"
Body: "Writing a research paper on hybrid frameworks."
Keywords: ["project management"]

→ intent_type: low_intent
→ intent_score: 10
→ sentiment: neutral
→ classification_reason: "Academic methodology research, no tool need or practical workflow discussion"

═══════════════════════════════════════════════
classification_reason FORMAT (max 300 chars)
═══════════════════════════════════════════════

Follow: "[What the post is about + signal observed] → [Why it's a reply opportunity or not]"

Good: "Asking what tools a 10-person ops team uses for project tracking → casual but direct reply opportunity"
Good: "Frustrated with Notion team permissions, thread will attract similar users → good visibility opportunity"
Good: "Evaluating Asana alternatives after price increase → mid-decision, reply can influence directly"
Bad:  "High relevance because keywords matched and user seems interested in the topic"
`.trim();
}

function buildUserPrompt(input: ClassifyLeadInput): string {
  const lines: string[] = [];

  lines.push("── PRODUCT BEING MONITORED ──");
  lines.push(`Name: ${input.project.name}`);
  lines.push(`Website: ${input.project.website_url ?? "not provided"}`);
  lines.push(`Value proposition: ${input.project.value_proposition ?? "not provided"}`);
  lines.push(`Region: ${input.project.region ?? "global / not specified"}`);
  lines.push(`Primary language: ${input.project.primary_language}`);

  const highValue = input.keywordsMatched.filter((k) => k.weight === "high");
  const normal = input.keywordsMatched.filter((k) => k.weight !== "high");

  lines.push("\n── KEYWORDS THAT MATCHED ──");
  if (highValue.length > 0) {
    lines.push(`HIGH-VALUE (competitor / active buying): ${highValue.map((k) => k.term).join(", ")}`);
    lines.push("↑ These signal active in-market evaluation. Weight heavily in your score.");
  }
  if (normal.length > 0) {
    lines.push(`Standard: ${normal.map((k) => k.term).join(", ")}`);
  }

  lines.push("\n── REDDIT POST ──");
  lines.push(`Subreddit: r/${input.post.subreddit}`);
  lines.push(`Title: ${input.post.title}`);
  lines.push(`Body:\n${input.post.body ?? "(no body)"}`);

  lines.push("\n── YOUR TASK ──");
  lines.push(
    "Classify using the rubric and examples in the system prompt.\n" +
    "Be precise with intent_score — avoid clustering at 50 or 80.\n" +
    "classification_reason must follow: '[Signal observed] → [Lead qualification]'"
  );

  return lines.join("\n");
}

// ─── Main export ─────────────────────────────────────────────

export async function classifyLeadCandidate(
  input: ClassifyLeadInput,
): Promise<LeadClassification> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = process.env.OPENAI_LEAD_CLASSIFIER_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const temperature = Number(process.env.OPENAI_LEAD_CLASSIFIER_TEMPERATURE ?? "0.1");
  const timeoutMs = Number(process.env.OPENAI_LEAD_CLASSIFIER_TIMEOUT_MS ?? "25000");
  const client = new OpenAI({ apiKey, timeout: timeoutMs });

  const response = await client.responses.parse(
    {
      model,
      temperature,
      instructions: buildSystemPrompt(),
      input: buildUserPrompt(input),
      max_output_tokens: 500,
      text: {
        format: zodTextFormat(leadClassificationSchema, "lead_classification"),
      },
    },
    { timeout: timeoutMs },
  );

  const parsed = response.output_parsed;
  if (!parsed) throw new Error("OpenAI returned no parsed lead classification");

  return {
    intentType: parsed.intent_type,
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

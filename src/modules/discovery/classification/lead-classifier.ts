import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { Enums } from "@/db/schemas/database.types";
import type { RedditPost } from "@/modules/discovery/reddit/types";
import type { KeywordMatchTarget } from "@/modules/discovery/classification/keyword-match";

export const LEAD_CLASSIFIER_PROMPT_VERSION = "v2";

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
You are a B2B SaaS lead qualification specialist. Your job is to read a Reddit post and determine
how likely the author is to be a real commercial lead for a specific SaaS product.

You will receive:
  - The SaaS product's name, website, and value proposition
  - The Reddit post (subreddit, title, body)
  - The keywords that triggered this post to be flagged
  - Whether any of those keywords are HIGH-VALUE (competitor comparison keywords)

═══════════════════════════════════════════════
INTENT TYPES — classify into exactly one
═══════════════════════════════════════════════

competitor_comparison — Author is directly comparing the product's competitors, asking "X vs Y",
  mentioning they're switching, or evaluating alternatives. HIGHEST INTENT.
  Examples: "Asana vs ClickUp for my team", "thinking of switching from Notion", "monday.com alternative"

active_buying — Author is explicitly looking for a tool, asking for recommendations, or describing
  requirements they need a product to meet. HIGH INTENT.
  Examples: "looking for a project management tool for 10 people", "what do you use for workflow automation"

pain_expression — Author is frustrated with their current tool or workflow but not yet explicitly
  evaluating alternatives. MEDIUM INTENT — they're primed but haven't started buying.
  Examples: "ClickUp keeps crashing", "our spreadsheets are out of control", "Asana automations are useless"

existing_user — Author is already using the product being monitored. Could be:
  - Positive: testimonial, recommendation → LOW lead value but good social proof signal
  - Negative: complaint, cancellation → CHURN RISK, flag for customer success
  Use sentiment field to distinguish. Score 30–50.

low_intent — General discussion, news articles, tutorials, job posts, memes, spam,
  or posts tangentially related to the product category without any stated need.
  Score 0–25.

═══════════════════════════════════════════════
SCORING RUBRIC — use this, not your intuition
═══════════════════════════════════════════════

  85–100 → competitor_comparison with specific use case mentioned + active evaluation signals
  70–84  → competitor_comparison OR active_buying with clear, specific need stated
  55–69  → active_buying with some ambiguity, OR strong pain_expression naming a competitor
  40–54  → pain_expression without competitor mention, OR existing_user with negative sentiment
  25–39  → existing_user positive, OR vague pain without clear product fit
  0–24   → low_intent, tangential, no buying signal

BOOST  +10 if: post is in a competitor's own subreddit (r/clickup, r/asana, r/notion, etc.)
REDUCE -15 if: post author appears to be a vendor/marketer (self-promotion signals)
REDUCE -20 if: post is about enterprise procurement with no personal decision-making signals

═══════════════════════════════════════════════
FEW-SHOT EXAMPLES
═══════════════════════════════════════════════

── EXAMPLE 1 ──
Subreddit: r/clickup
Title: "Seriously considering leaving ClickUp — what are people using instead?"
Body: "Been on ClickUp for 2 years. The UI keeps changing, our team hates the onboarding for new people.
We're 12 people, mostly non-technical ops team. Budget is around $15/user/month. Looked at monday briefly."
Keywords: ["ClickUp alternative", "switching from ClickUp"] (HIGH-VALUE)

→ intent_type: competitor_comparison
→ intent_score: 92
→ sentiment: negative
→ classification_reason: "Actively leaving ClickUp, 12-person ops team with stated budget → ideal ICP in purchase mode"

── EXAMPLE 2 ──
Subreddit: r/projectmanagement
Title: "Best tool for cross-functional project tracking?"
Body: "Our marketing and engineering teams are misaligned. We use spreadsheets now.
Looked at Asana and Notion. Open to suggestions, need something visual."
Keywords: ["Asana vs", "project tracking tool"] (HIGH-VALUE: Asana vs)

→ intent_type: active_buying
→ intent_score: 78
→ sentiment: neutral
→ classification_reason: "Evaluating Asana + Notion, spreadsheet pain, cross-functional need → strong fit, not yet committed"

── EXAMPLE 3 ──
Subreddit: r/marketing
Title: "Our campaign tracker is a disaster"
Body: "We're using a mix of Google Sheets and Trello and nothing is connected.
Deadlines keep slipping. It's embarrassing."
Keywords: ["spreadsheet workflow nightmare"]

→ intent_type: pain_expression
→ intent_score: 58
→ sentiment: negative
→ classification_reason: "Clear workflow pain (sheets + Trello), marketing team, no tool evaluation yet — primed lead"

── EXAMPLE 4 ──
Subreddit: r/productivity
Title: "monday.com raised prices again"
Body: "Just got the email. Going from $10 to $14/user. That's insane for a 30-person team."
Keywords: ["monday.com pricing"]

→ intent_type: existing_user
→ intent_score: 45
→ sentiment: negative
→ classification_reason: "Existing monday.com user upset about pricing hike → churn risk, not a new lead"

── EXAMPLE 5 (LOW INTENT) ──
Subreddit: r/technology
Title: "monday.com IPO analysis — is it worth investing?"
Body: "Looking at their revenue growth and churn metrics for my portfolio..."
Keywords: ["monday.com"]

→ intent_type: low_intent
→ intent_score: 5
→ sentiment: neutral
→ classification_reason: "Financial/investment discussion, not a buyer — keyword match is incidental"

── EXAMPLE 6 (LOW INTENT) ──
Subreddit: r/projectmanagement
Title: "Comparison of project management methodologies"
Body: "Agile vs Waterfall vs Kanban — which is best for software teams?"
Keywords: ["project management"]

→ intent_type: low_intent
→ intent_score: 12
→ sentiment: neutral
→ classification_reason: "Methodology discussion, no tool evaluation, no stated need — informational only"

═══════════════════════════════════════════════
classification_reason FORMAT (max 300 chars)
═══════════════════════════════════════════════

Always follow: "[Signal observed] → [Lead qualification]"

Good: "Comparing Asana vs ClickUp for 20-person ops team, budget mentioned → high-fit active buyer"
Good: "Frustrated with Notion for project tracking, no evaluation yet → warm lead, needs nurturing"
Bad:  "The post shows intent because the user mentioned a competitor tool and seems interested"
Bad:  "High intent score based on keywords matched"
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

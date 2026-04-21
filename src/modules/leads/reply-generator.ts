import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  leadIdSchema,
  projectIdSchema,
  type LeadDTO,
  type ProjectDTO,
  type ReplyStyle,
} from "@/db/schemas/domain";

export const REPLY_PROMPT_VERSION = "v3_intent_aware";

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

// ─── Tone Templates ───────────────────────────────────────────

type ToneTemplate = {
  label: string;
  instructions: string;
};

const toneTemplates: Record<string, ToneTemplate> = {
  founder_led: {
    label: "Founder-led",
    instructions:
      "Sound like a founder or senior operator replying personally: candid, specific, low-polish, and grounded in lived experience. Use first person only when it fits the post.",
  },
  helpful_consultant: {
    label: "Helpful consultant",
    instructions:
      "Diagnose the situation before pitching. Ask one useful question when appropriate, explain tradeoffs, and keep the product mention secondary.",
  },
  technical_operator: {
    label: "Technical operator",
    instructions:
      "Be precise and implementation-minded. Mention concrete workflows, constraints, and failure modes. Avoid vague marketing language.",
  },
  direct_sales: {
    label: "Direct sales",
    instructions:
      "Be brief, transparent, and explicit about fit. State why the product may help, what it is not for, and avoid manufactured excitement.",
  },
};

// ─── Intent Strategy ─────────────────────────────────────────

function intentStrategy(intentType: string | null | undefined): string {
  switch (intentType) {
    case "competitor_comparison":
      return [
        "INTENT: The author is actively comparing tools or considering switching from a competitor.",
        "STRATEGY: This is the highest-intent post type. Be direct about the product as an option.",
        "- Acknowledge what they said about the competitor specifically — do not ignore it",
        "- Mention 1-2 concrete differentiators relevant to their stated use case",
        "- Do NOT attack the competitor — respect their current tool, just highlight the difference",
        "- Mentioning the product clearly and including the URL is appropriate here",
      ].join("\n");

    case "active_buying":
      return [
        "INTENT: The author is actively looking for a tool or asking for recommendations.",
        "STRATEGY: They want options — be one of the options, but don't be the only one.",
        "- Briefly validate what they're looking for (shows you read the post)",
        "- Describe what the product does in 1-2 sentences tied to their specific requirements",
        "- If the product genuinely doesn't fit something they mentioned, acknowledge it honestly",
        "- Mention the URL but don't make it the entire reply",
      ].join("\n");

    case "pain_expression":
      return [
        "INTENT: The author is frustrated with their current situation but not yet evaluating alternatives.",
        "STRATEGY: Lead with empathy and a useful insight. Product mention should feel like a natural suggestion, not a pitch.",
        "- Open by validating the specific pain they described — be specific, not generic",
        "- If you can add a useful observation or tip about the problem itself, do it",
        "- Introduce the product as something worth trying, not as THE solution",
        "- Keep the URL optional — only include it if the reply would feel incomplete without it",
      ].join("\n");

    case "existing_user":
      return [
        "INTENT: The author is already using the product being monitored.",
        "STRATEGY: Do NOT pitch the product they're already using. This changes the entire approach.",
        "- If sentiment is negative: acknowledge the frustration, offer a concrete tip or workaround",
        "- If sentiment is positive: engage naturally, reinforce the value they found",
        "- Never say 'glad you're using [product]!' — sounds like a support bot",
        "- This is a retention/community interaction, not a sales reply",
      ].join("\n");

    default:
      return [
        "INTENT: Low or unclear buying signal.",
        "STRATEGY: Add genuine value to the discussion. Do NOT pitch.",
        "- Contribute a useful perspective, fact, or question",
        "- Mention the product only if it's a genuinely natural fit for what's being discussed",
        "- When in doubt, don't mention the product at all",
      ].join("\n");
  }
}

// ─── Style Instructions ───────────────────────────────────────

function styleInstruction(style: ReplyStyle): string {
  if (style === "direct") {
    return [
      "STYLE — Direct:",
      "- Open with the most relevant point, no warm-up sentences",
      "- 2-4 short paragraphs max. Cut everything that doesn't move the reply forward.",
      "- Mention the product and URL clearly, but only once",
      "- End with a concrete next step or offer, not a generic 'let me know if you have questions'",
    ].join("\n");
  }

  if (style === "balanced") {
    return [
      "STYLE — Balanced:",
      "- Open by addressing the post's core question or pain before introducing the product",
      "- Offer a useful observation or tip that would help even if the reader doesn't buy anything",
      "- Introduce the product as one option — not as the definitive answer",
      "- 3-5 paragraphs. Conversational but not rambling.",
      "- URL is fine but frame it as 'if you want to explore' rather than 'check us out'",
    ].join("\n");
  }

  return [
    "STYLE — Engaging:",
    "- Open with a question, an observation, or a shared experience — not with the product",
    "- Build rapport before even hinting at the product (can be as late as the last paragraph)",
    "- Ask one genuine follow-up question if it would make the reply more useful",
    "- Product mention should feel like a friend's recommendation, not a cold pitch",
    "- Avoid the URL unless the reply feels incomplete without it",
  ].join("\n");
}

// ─── Few-Shot Examples ────────────────────────────────────────
// These are for a hypothetical Work OS product — study the
// STRUCTURE (format, length, tone), not the content.
// Stable content → stays in system prompt → maximizes cache hits.

const FEW_SHOT_EXAMPLES = `
═══════════════════════════════════════════════
FEW-SHOT EXAMPLES — use as quality benchmark
(hypothetical Work OS product — study structure, not content)
═══════════════════════════════════════════════

── BAD REPLIES (never write like this) ──

BAD 1 — Generic opener + product dump:
"Great question! At [Product], we help teams manage projects more efficiently.
Our platform offers automation, integrations, and real-time collaboration.
Check it out at [URL] — we have a free trial!"
Why bad: Could be posted on any thread. No connection to what was asked.
"Great question!" is an instant bot signal.

BAD 2 — Competitor attack:
"ClickUp is honestly a mess. The UI is terrible and their support is awful.
[Product] is way better — cleaner interface, better automations, and actually reliable."
Why bad: Sounds defensive and biased. Reddit users distrust competitor attacks.

BAD 3 — Overselling:
"[Product] literally solved every problem you mentioned. It's a game-changer for teams like yours.
Thousands of teams have switched and never looked back. Don't waste more time with bad tools!"
Why bad: Hype language. "Game-changer", "never looked back" → instant credibility loss.

── GOOD REPLIES ──

GOOD 1 — competitor_comparison + direct style:
"We switched from Asana about a year ago — the main difference for a cross-functional team
was flexibility in how you structure boards. Asana's task hierarchy is pretty fixed, whereas
with [Product] we built views that matched how each team thinks (ops vs marketing vs engineering).
Not saying it's perfect but it solved the 'everyone uses it differently' problem.
Worth a look if that's the friction you're hitting: [URL]"
Why good: Specific to their problem, personal experience, honest ("not perfect"), URL at the end.

GOOD 2 — active_buying + balanced style:
"For a 10-person team tracking client projects, the tools that tend to stick are the ones
non-technical people actually adopt — which rules out a lot of the more powerful but complex options.
Notion is great for docs but the project management side takes work to set up. ClickUp has more
features than most small teams need and the learning curve shows.
[Product] sits somewhere in the middle — visual, fast to set up, but scales if you grow.
There's a free tier if you want to test it without commitment: [URL]
What kind of projects are you tracking — internal work or client-facing?"
Why good: Gives context on alternatives, honest about tradeoffs, question at the end shows interest.

GOOD 3 — pain_expression + engaging style:
"The spreadsheet + email combo for project tracking is such a specific kind of hell —
everything looks fine until someone updates the wrong version or forgets to CC someone.
What's the team size? That usually determines whether the fix is a shared doc structure
or actually moving to a dedicated tool. For teams past ~6-7 people we've found that
the coordination overhead alone justifies something like [Product] — but it depends
on how structured your workflows are.
What's the part that's breaking down most — deadlines, visibility, or handoffs?"
Why good: Opens with specific empathy, asks before pitching, product mention is light and conditional.
`.trim();

// ─── Anti-Patterns ────────────────────────────────────────────

const ANTI_PATTERNS = `
═══════════════════════════════════════════════
ANTI-PATTERNS — never use these phrases or structures
═══════════════════════════════════════════════
- "Great question!" / "Great post!" / "This is such a valid concern"
- "I work at [Product]" or "Disclaimer: I'm from [Product]" — sounds like legal CYA
- "Game-changer" / "revolutionary" / "best-in-class" / "industry-leading"
- "Thousands of teams use [Product]" — unverifiable, reads as marketing copy
- "Happy to help!" / "Feel free to reach out!" / "Let me know if you have questions!"
- Opening with the product name in the first sentence
- Ending with just a URL and nothing else
- Bullet-point lists of product features as the entire reply
- "As someone who works in this space..." — vague and suspicious
`.trim();

// ─── System Prompt (stable — maximizes cache hits) ────────────

function buildSystemPrompt(style: ReplyStyle): string {
  return [
    "You write Reddit replies on behalf of a B2B SaaS company.",
    "Your goal: write a reply that sounds like a knowledgeable human Reddit user — not a marketer, not a bot.",
    "The reply should add genuine value to the conversation. If mentioning the product, it should feel like a natural, honest recommendation — not a pitch.",
    "",
    FEW_SHOT_EXAMPLES,
    "",
    ANTI_PATTERNS,
    "",
    "═══════════════════════════════════════════════",
    "GENERAL RULES",
    "═══════════════════════════════════════════════",
    "- Match the language of the post (casual post → casual reply; technical post → technical reply)",
    "- Never invent product features not mentioned in the project context",
    "- Never fabricate user numbers, case studies, or results",
    "- If the product genuinely doesn't fit what the user needs, say so or stay silent on fit",
    "- Reddit readers detect inauthenticity immediately",
    "- Do not mention that you are an AI",
    "",
    styleInstruction(style),
  ].join("\n");
}

// ─── User Prompt (variable per request) ──────────────────────

function buildUserPrompt(
  context: ReplyGenerationContext,
  style: ReplyStyle,
): string {
  const { project, lead } = context;
  const toneTemplate = resolveToneTemplate(project.tone);
  const lines: string[] = [];

  lines.push("── PRODUCT ──");
  lines.push(`Name: ${project.name}`);
  lines.push(`Website: ${project.website_url ?? "not provided"}`);
  lines.push(`Value proposition: ${project.value_proposition ?? "not provided"}`);
  lines.push(`Region: ${project.region ?? "global"}`);
  lines.push(`Primary language: ${project.primary_language}`);
  if (project.secondary_language) {
    lines.push(`Secondary language: ${project.secondary_language}`);
  }

  lines.push("\n── TONE ──");
  lines.push(`Template: ${toneTemplate.label}`);
  lines.push(`Instructions: ${toneTemplate.instructions}`);

  lines.push("\n── INTENT STRATEGY ──");
  lines.push(intentStrategy(lead.intent_type));
  lines.push(
    `\nWhy this post was flagged (classifier output — use to inform your strategy, do NOT repeat verbatim in reply):\n"${lead.classification_reason ?? "not provided"}"`,
  );

  lines.push("\n── REDDIT POST ──");
  lines.push(`Subreddit: r/${lead.subreddit}`);
  lines.push(`Author: ${lead.author ? `u/${lead.author}` : "unknown"}`);
  lines.push(`Title: ${lead.title}`);
  lines.push(`Body:\n${lead.body || "(no body)"}`);
  lines.push(`Keywords that matched: ${lead.keywords_matched.join(", ") || "none"}`);

  lines.push("\n── YOUR TASK ──");
  lines.push(
    `Write a Reddit reply for this post using the ${style} style and ${toneTemplate.label} tone.\n` +
    `Follow the intent strategy above — it determines how prominently to feature the product.\n` +
    `Use the GOOD examples in the system prompt as your quality and length benchmark.\n` +
    `Do not use any of the anti-patterns listed.`,
  );

  return lines.join("\n");
}

// ─── Context loader ───────────────────────────────────────────

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
  intent_type,
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
  last_searchbox_at,
  scrape_fail_count,
  scrape_backoff_until,
  last_scrape_error,
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

  const [{ data: project, error: projectError }, { data: lead, error: leadError }] =
    await Promise.all([
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

// ─── Main export ──────────────────────────────────────────────

export async function generateLeadReplyVariant(
  context: ReplyGenerationContext,
  style: ReplyStyle,
): Promise<GeneratedLeadReplyVariant> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = process.env.OPENAI_REPLY_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const temperature = Number(process.env.OPENAI_REPLY_TEMPERATURE ?? "0.4");
  const timeoutMs = Number(process.env.OPENAI_REPLY_TIMEOUT_MS ?? "30000");
  const client = new OpenAI({ apiKey, timeout: timeoutMs });

  const response = await client.responses.parse(
    {
      model,
      temperature,
      instructions: buildSystemPrompt(style),
      input: buildUserPrompt(context, style),
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

// ─── Tone helpers ─────────────────────────────────────────────

function resolveToneTemplate(tone: string | null): ToneTemplate {
  const normalized = normalizeToneKey(tone);

  if (normalized && toneTemplates[normalized]) {
    return toneTemplates[normalized];
  }

  if (tone?.trim()) {
    return {
      label: "Custom",
      instructions: [
        "Custom tone from project settings:",
        tone.trim(),
        "Apply this tone unless it conflicts with being helpful, honest, and non-spammy on Reddit.",
      ].join("\n"),
    };
  }

  return {
    label: "Default",
    instructions:
      "Practical, calm, lightly conversational, written like a real Reddit user. No corporate slogans.",
  };
}

function normalizeToneKey(tone: string | null): string | null {
  if (!tone) return null;
  return tone
    .trim()
    .toLocaleLowerCase()
    .replace(/^template:/, "")
    .replace(/[\s-]+/g, "_");
}

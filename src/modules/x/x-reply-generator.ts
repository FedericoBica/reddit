import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { projectIdSchema, type XPostDTO, type ProjectDTO } from "@/db/schemas/domain";

export const X_REPLY_PROMPT_VERSION = "v1";

const xReplySchema = z.object({
  content: z.string().trim().min(10).max(280),
});

export type XReplyStyle = "hook" | "reply" | "mention";
export const X_REPLY_STYLES: XReplyStyle[] = ["hook", "reply", "mention"];

export type GeneratedXReplyVariant = {
  style: XReplyStyle;
  content: string;
  promptVersion: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

type XReplyContext = {
  project: Pick<ProjectDTO, "name" | "website_url" | "value_proposition" | "region" | "primary_language">;
  post: Pick<XPostDTO, "text" | "author_username" | "author_name" | "keywords_matched" | "classification_reason" | "sentiment">;
};

// ─── Style instructions ───────────────────────────────────────

function styleInstruction(style: XReplyStyle): string {
  if (style === "hook") {
    return [
      "STYLE — Hook:",
      "Start with an observation, question, or shared experience that earns attention.",
      "Do NOT mention the product. Goal is to get the author to reply or engage.",
      "One or two short sentences max. No call to action.",
    ].join("\n");
  }

  if (style === "reply") {
    return [
      "STYLE — Reply:",
      "Respond directly and usefully, like a colleague who has context.",
      "You may mention the product if it fits naturally — one sentence, no pitch language.",
      "Skip the URL unless the reply would feel incomplete without it.",
    ].join("\n");
  }

  return [
    "STYLE — Mention:",
    "Add value first: a data point, perspective, or concrete tip.",
    "End with a soft product mention as one natural option — never as THE answer.",
    "No URL. No hashtags.",
  ].join("\n");
}

// ─── Anti-patterns ────────────────────────────────────────────

const ANTI_PATTERNS = `
ANTI-PATTERNS — never use these:
- Starting with "Hey @username" — sounds like a bot
- Hashtags of any kind — signals marketing account
- "Check our link in bio"
- More than 2 sentences in a row without a period — X is read on fast scroll
- "Exactly!" / "Great point!" — instant bot flag
- Emoji spam — one max, only if casual tone fits
- Repeating what the tweet already said without adding anything
- URL unless the style is "reply" and the fit is obvious
`.trim();

// ─── Few-shot examples ────────────────────────────────────────

const FEW_SHOT = `
EXAMPLES — study length and tone, not product content (hypothetical analytics SaaS)

BAD:
"Hey, great question! At [Product] we help teams track metrics effortlessly. Check us out! #analytics #saas"
Why bad: bot opener, hashtags, no value, just a pitch.

BAD:
"Totally agree, this is such a pain point for teams. We actually built [Product] to solve exactly this. Game changer! 🚀🚀"
Why bad: hype language, emoji spam, "totally agree" is a bot phrase.

GOOD (hook):
"The problem usually isn't the tool — it's that nobody owns the metric definition. Two teams measuring the same thing differently will fight forever."

GOOD (reply):
"Depends how much custom SQL you need. If it's mostly dashboards, [Product] covers it without the overhead. If you're doing heavy transformations, you'll want dbt upstream regardless."

GOOD (mention):
"Under 50k events/day almost anything works. Past that, sampling strategy matters a lot. We hit this with [Product] and ended up building custom aggregations — not fun."
`.trim();

// ─── System prompt ────────────────────────────────────────────

function buildSystemPrompt(style: XReplyStyle): string {
  return [
    "You write replies on X (Twitter) on behalf of a SaaS team.",
    "X is not Reddit or LinkedIn. The rules are different:",
    "- 280 chars max — every word counts",
    "- Fast scroll — the first sentence decides if they read the rest",
    "- X users spot marketing accounts immediately",
    "- A useful reply with no product mention beats a pitch that adds nothing",
    "",
    ANTI_PATTERNS,
    "",
    FEW_SHOT,
    "",
    styleInstruction(style),
  ].join("\n");
}

// ─── User prompt ─────────────────────────────────────────────

function buildUserPrompt(ctx: XReplyContext, style: XReplyStyle): string {
  return [
    `Product: ${ctx.project.name}`,
    `Value proposition: ${ctx.project.value_proposition ?? "not provided"}`,
    `Region: ${ctx.project.region ?? "global"}`,
    `Language: ${ctx.project.primary_language}`,
    "",
    "Tweet:",
    ctx.post.text,
    "",
    `Keywords matched: ${ctx.post.keywords_matched.join(", ") || "none"}`,
    ctx.post.classification_reason
      ? `Classifier note (context only — do NOT repeat verbatim): ${ctx.post.classification_reason}`
      : "",
    "",
    `Write a "${style}" style reply. Max 280 chars. No URL. No hashtags.`,
  ].filter(Boolean).join("\n");
}

// ─── Context loader ───────────────────────────────────────────

const xPostReplyContextColumns = `
  id, project_id, text, author_username, author_name,
  keywords_matched, classification_reason, sentiment
`;

export async function getXReplyGenerationContext(
  projectId: string,
  xPostId: string,
): Promise<XReplyContext> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = createSupabaseAdminClient();

  const [{ data: project, error: projectError }, { data: post, error: postError }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name, website_url, value_proposition, region, primary_language")
        .eq("id", parsedProjectId)
        .single(),
      supabase
        .from("x_posts")
        .select(xPostReplyContextColumns)
        .eq("project_id", parsedProjectId)
        .eq("id", xPostId)
        .single(),
    ]);

  if (projectError) throw new Error(`Failed to load project for X reply generation: ${projectError.message}`);
  if (postError) throw new Error(`Failed to load X post for reply generation: ${postError.message}`);

  return { project, post };
}

// ─── Main export ──────────────────────────────────────────────

export async function generateXReplyVariant(
  ctx: XReplyContext,
  style: XReplyStyle,
): Promise<GeneratedXReplyVariant> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = process.env.OPENAI_REPLY_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const client = new OpenAI({ apiKey, timeout: 30_000 });

  const response = await client.responses.parse(
    {
      model,
      temperature: 0.7,
      instructions: buildSystemPrompt(style),
      input: buildUserPrompt(ctx, style),
      max_output_tokens: 120,
      text: {
        format: zodTextFormat(xReplySchema, `x_reply_${style}`),
      },
    },
    { timeout: 30_000 },
  );

  const parsed = response.output_parsed;
  if (!parsed) throw new Error(`X reply generator returned no output for style ${style}`);

  return {
    style,
    content: parsed.content.trim(),
    promptVersion: X_REPLY_PROMPT_VERSION,
    model,
    inputTokens: response.usage?.input_tokens ?? null,
    outputTokens: response.usage?.output_tokens ?? null,
  };
}

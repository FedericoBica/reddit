import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { ProjectDTO } from "@/db/schemas/domain";
import type { CompetitorContext } from "./suggestion-generator";

const xKeywordSchema = z.object({
  queries: z
    .array(
      z.object({
        query: z.string().trim().min(1).max(512),
        category: z.enum(["pain", "comparison", "competitor", "churn"]),
        rationale: z.string().trim().min(1).max(200),
      }),
    )
    .min(6)
    .max(15),
});

export type GeneratedXKeywords = {
  queries: {
    query: string;
    category: "pain" | "comparison" | "competitor" | "churn";
    rationale: string;
  }[];
  usage: {
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
  };
};

export async function generateXKeywords(
  project: ProjectDTO,
  competitors: CompetitorContext[] = [],
): Promise<GeneratedXKeywords> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const client = new OpenAI({ apiKey, timeout: 25_000 });

  const response = await client.responses.parse({
    model,
    temperature: 0.2,
    instructions: buildSystemPrompt(),
    input: buildUserPrompt(project, competitors),
    max_output_tokens: 1_200,
    text: { format: zodTextFormat(xKeywordSchema, "x_keyword_suggestions") },
  });

  const parsed = response.output_parsed;
  if (!parsed) throw new Error("X keyword generator returned no output");

  const seen = new Set<string>();
  const deduped = parsed.queries.filter((q) => {
    const key = q.query.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    queries: deduped,
    usage: {
      model,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    },
  };
}

function buildSystemPrompt(): string {
  return `
You generate X (Twitter) API search queries for B2B SaaS lead generation.

X search is NOT like Reddit search. Tweets are short bursts — pain, hot takes, public complaints, direct questions.
A good X query surfaces posts where someone is expressing frustration, asking for alternatives, or announcing they are switching tools — in 280 characters or less.

═══════════════════════════════════════════════
X QUERY SYNTAX RULES — MANDATORY
═══════════════════════════════════════════════

Every query you generate MUST:
  ✓ End with: -is:retweet lang:en  (or the project's primary language)
  ✓ Use quotes for exact phrases: "switching from" "looking for"
  ✓ Use OR for variants inside parentheses: (frustrated OR "not working" OR slow)
  ✓ Stay under 512 characters total
  ✓ Be a valid X API v2 search query

Optional but powerful:
  · min_faves:5      → filters noise, surfaces content with real engagement
  · min_replies:2    → signals a conversation is happening
  · has:links        → if you want posts sharing a competitor's content

Never use:
  ✗ Hashtags as the primary signal (too gameable, too noisy)
  ✗ Long natural language phrases that won't match tweet text
  ✗ Generic terms without context operators

═══════════════════════════════════════════════
TWEET LANGUAGE IS COMPRESSED — adapt accordingly
═══════════════════════════════════════════════

Reddit users write paragraphs. X users write fragments.
A Reddit keyword: "ClickUp too complicated for non-technical team"
The X equivalent: "ClickUp" (complicated OR confusing OR overwhelming) -is:retweet lang:en

A Reddit keyword: "looking for Notion alternative for project management"
The X equivalent: "Notion alternative" -is:retweet lang:en
Or: "switching from Notion" -is:retweet lang:en

═══════════════════════════════════════════════
CATEGORIES — generate queries in all 4
═══════════════════════════════════════════════

PAIN — expressions of frustration with a workflow or tool
  Pattern: "[Competitor]" (hate OR slow OR broken OR frustrating OR "doesn't work") -is:retweet lang:en
  Or: "[specific pain in natural tweet language]" -is:retweet lang:en

COMPARISON — active evaluation, asking for recommendations
  Pattern: "[Competitor] vs" OR "[Competitor] alternative" -is:retweet lang:en
  Or: "looking for" "[category]" -is:retweet lang:en min_replies:2

COMPETITOR — brand mentions with negative or evaluative signals
  Pattern: "[Competitor]" (expensive OR pricing OR "too much" OR overpriced) -is:retweet lang:en
  Or: "[Competitor]" (disappointing OR buggy OR "customer support") -is:retweet lang:en

CHURN — explicit signals of switching or cancelling
  Pattern: "switching from [Competitor]" -is:retweet lang:en
  Or: "cancelled [Competitor]" OR "leaving [Competitor]" -is:retweet lang:en
  Or: "replaced [Competitor]" -is:retweet lang:en

═══════════════════════════════════════════════
FEW-SHOT EXAMPLES (for a project management SaaS)
═══════════════════════════════════════════════

GOOD queries:
  ✓ "ClickUp" (complicated OR overwhelming OR slow) -is:retweet lang:en
  ✓ "switching from Asana" -is:retweet lang:en
  ✓ "Notion alternative" (team OR project OR task) -is:retweet lang:en min_faves:3
  ✓ "Asana" (pricing OR expensive OR "per seat") -is:retweet lang:en
  ✓ "monday.com" (cancelled OR leaving OR alternative) -is:retweet lang:en
  ✓ "looking for" "project management" tool -is:retweet lang:en min_replies:2
  ✓ "ClickUp vs" -is:retweet lang:en
  ✓ "tired of" (Asana OR Notion OR ClickUp) -is:retweet lang:en

BAD queries (do NOT generate these):
  ✗ #ProjectManagement tools -is:retweet → hashtag-led, too noisy
  ✗ best project management software for small teams -is:retweet → won't match tweets
  ✗ I am looking for a project management solution -is:retweet → too long, won't match
  ✗ "project management" -is:retweet → too broad, no intent signal

Output 8–12 queries. Prioritize competitor-specific ones — those have highest intent.
`.trim();
}

function buildUserPrompt(project: ProjectDTO, competitors: CompetitorContext[]): string {
  const lines: string[] = [
    "═══════════════════════════════════════",
    "COMPANY",
    "═══════════════════════════════════════",
    `Name: ${project.name}`,
    `Website: ${project.website_url ?? "not provided"}`,
    `Primary language: ${project.primary_language}`,
  ];

  if (project.value_proposition) {
    lines.push(`\nDescription:\n${project.value_proposition}`);
    lines.push("↑ Extract: what problem they solve, who the ICP is, what tools/workflows they replace.");
  }

  if (competitors.length > 0) {
    lines.push("\n═══════════════════════════════════════");
    lines.push("COMPETITORS");
    lines.push("═══════════════════════════════════════");
    lines.push("Generate at least 2 queries per competitor — use the competitor name exactly as it appears on their site.");

    for (const c of competitors) {
      const name = c.name.replace(/\.[a-z]{2,}$/i, "");
      lines.push(`\n── ${name.toUpperCase()} ──`);
      lines.push(`Site: ${c.websiteUrl}`);
      if (c.websiteContent) {
        lines.push(`Content snippet:\n${c.websiteContent.slice(0, 600)}`);
        lines.push("↑ Use this to find their brand name, pricing angle, and known pain points.");
      }
    }
  }

  lines.push("\n═══════════════════════════════════════");
  lines.push("YOUR TASK");
  lines.push("═══════════════════════════════════════");
  lines.push(
    `Generate 8–12 X API search queries for ${project.name}.\n` +
    `Language filter to use: lang:${project.primary_language}\n` +
    (competitors.length > 0
      ? `Mandatory: ≥2 queries per competitor (${competitors.map((c) => c.name).join(", ")}). Cover pain, comparison, and churn signals for each.`
      : "Infer likely competitors from the description and cover each with at least 2 queries."),
  );

  return lines.join("\n");
}

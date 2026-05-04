import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { ProjectDTO } from "@/db/schemas/domain";

const xKeywordResponseSchema = z.object({
  keywords: z
    .array(
      z.object({
        query: z.string().trim().min(1).max(256),
        rationale: z.string().trim().min(1).max(200),
      }),
    )
    .min(3)
    .max(10),
});

export type GeneratedXKeywords = {
  keywords: string[];
  usage: {
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
  };
};

export async function generateXKeywords(project: ProjectDTO): Promise<GeneratedXKeywords> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const client = new OpenAI({ apiKey, timeout: 25_000 });

  const response = await client.responses.parse(
    {
      model,
      temperature: 0.6,
      instructions: buildSystemPrompt(),
      input: buildUserPrompt(project),
      max_output_tokens: 800,
      text: {
        format: zodTextFormat(xKeywordResponseSchema, "x_keyword_suggestions"),
      },
    },
    { timeout: 25_000 },
  );

  const parsed = response.output_parsed;
  if (!parsed) throw new Error("OpenAI returned no parsed X keywords");

  const seen = new Set<string>();
  const keywords = parsed.keywords
    .map((k) => k.query.trim())
    .filter((q) => {
      const key = normalizeQuery(q);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return {
    keywords,
    usage: {
      model,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    },
  };
}

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/["""]/g, "")
    .replace(/\bto\b|\bfor\b|\ba\b|\ban\b|\bthe\b/g, "")
    .trim()
    .split(/\s+/)
    .sort()
    .join(" ");
}

function buildSystemPrompt(): string {
  return `
You are an X (Twitter) lead generation specialist for B2B SaaS companies.

Your job: generate X search queries that surface tweets where real buyers express pain,
evaluate tools, or switch from competitors — tweets where this company's product is the answer.

WHY X SEARCH REQUIRES PRECISION
X is far noisier than Reddit. A broad query drowns in marketing content, hot takes, and bots.
Reddit users write long posts — broad terms still match relevant content.
X users write 10-word tweets — you need the EXACT phrase they tweet or you miss them entirely.

QUERY FORMAT — MANDATORY RULES
✓ Use quoted phrases ("exact phrase") — critical for precision on X
✓ 2–6 words total (including words inside quotes)
✓ Match the conversational, casual tone of actual tweets
✗ NO hashtags — they exclude the majority of relevant posts
✗ NO single words — returns only noise
✗ NO long sentences — X users are brief
✗ NO marketing language — target raw user expressions, not polished copy

PATTERNS TO COVER — at least 2 per competitor
1. SWITCHING INTENT  → "leaving [Competitor]", "[Competitor] alternative", "switch from [Competitor]"
2. COMPETITOR PAIN   → "[Competitor] too expensive", "frustrated with [Competitor]", "[Competitor] too slow"
3. ACTIVE SHOPPING   → "recommend [category]", "looking for [category]", "best [category] tool"
4. COMPARISON        → "[Competitor] vs [Competitor]", "[category] recommendations"
5. QUESTION HUNTING  → "how do I [pain]" -filter:links, "any [category] recommendations" -filter:links
   Use -filter:links to strip promotional tweets and isolate genuine user questions.
   Each question-hunting query must be its own entry — do not combine with OR operators.

Prioritize competitor-specific terms — those have the highest conversion intent.
If no competitors are mentioned, infer 2–3 likely competitors from the product category.

X SEARCH OPERATORS YOU MAY USE
  -filter:links   → strips promotional tweets; use on question-hunting queries
  lang:XX         → restrict to a language (e.g. lang:es, lang:en); use when the
                    primary language differs from English
  min_faves:N     → optional on comparison queries to surface high-signal conversations;
                    keep N low (10–50) to avoid empty results
Do NOT use: hashtags, OR inside parentheses, near:, within:, or any deprecated operators.

LANGUAGE
Write queries in the product's primary language unless it is a global English-first product.
If the primary language is Spanish, queries should be in Spanish (e.g. "alternativa a Notion").

AVOID SEMANTIC DUPLICATES
Do not generate rearrangements of the same words:
  ✗ "Asana alternative" + "alternative to Asana" → keep only one
  ✗ "switch from ClickUp" + "leaving ClickUp" → keep only the more natural phrasing
Each query must cover a meaningfully different signal or competitor.

QUALITY BAR
Before including a query, ask: "If I searched this on X right now, would the top results be
people who need this product?" If not, make it more specific.
`.trim();
}

function buildUserPrompt(project: ProjectDTO): string {
  const lines: string[] = [];

  lines.push("COMPANY");
  lines.push(`Name: ${project.name}`);
  lines.push(`Website: ${project.website_url ?? "not provided"}`);
  lines.push(`Region: ${project.region ?? "Global"}`);
  lines.push(`Primary Language: ${project.primary_language}`);

  if (project.value_proposition) {
    lines.push(`\nProduct description:\n${"─".repeat(40)}`);
    lines.push(project.value_proposition);
    lines.push("─".repeat(40));
    lines.push(
      "↑ Extract: (1) the exact problem solved, (2) who the ICP is, " +
      "(3) which tools/workflows this replaces, (4) likely competitors.",
    );
  }

  lines.push("\nTASK");
  lines.push(
    `Generate 5–10 X (Twitter) search queries for ${project.name}.\n\n` +
    `Each query must:\n` +
    ` • Capture a tweet a real buyer would post (not a marketer)\n` +
    ` • Use quoted phrases where precision matters\n` +
    ` • Cover competitor pain, switching intent, or explicit recommendation requests\n` +
    ` • Be written in ${project.primary_language} unless English is clearly dominant in this niche\n` +
    ` • Be semantically distinct from every other query in the list`,
  );

  return lines.join("\n");
}

import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { ProjectDTO } from "@/db/schemas/domain";
import type { CompetitorContext } from "./suggestion-generator";

const searchboxKeywordSchema = z.object({
  terms: z
    .array(z.string().trim().min(1).max(100))
    .min(6)
    .max(15),
});

export type GeneratedSearchboxKeywords = {
  terms: string[];
  usage: {
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
  };
};

export async function generateSearchboxKeywords(
  project: ProjectDTO,
  competitors: CompetitorContext[] = [],
): Promise<GeneratedSearchboxKeywords> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const client = new OpenAI({ apiKey, timeout: 25_000 });

  const response = await client.responses.parse({
    model,
    temperature: 0.2,
    instructions: buildSystemPrompt(),
    input: buildUserPrompt(project, competitors),
    max_output_tokens: 800,
    text: { format: zodTextFormat(searchboxKeywordSchema, "searchbox_keywords") },
  });

  const parsed = response.output_parsed;
  if (!parsed) throw new Error("Searchbox keyword generator returned no output");

  const seen = new Set<string>();
  const deduped = parsed.terms.filter((t) => {
    const key = t.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    terms: deduped,
    usage: {
      model,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    },
  };
}

function buildSystemPrompt(): string {
  return `
You generate short Google search queries for a B2B SaaS lead generation tool.

These queries will be sent to Google as: "<query> site:reddit.com"
The goal is to surface Reddit threads where buyers are actively evaluating, comparing or switching tools.

═══════════════════════════════════════════════
RULES — MANDATORY
═══════════════════════════════════════════════

✓ Short: 2–6 words maximum. These must match actual Google search behavior.
✓ High intent: target people in evaluation or decision mode, not casual readers.
✓ No filler words: drop "I", "we", "the", "a" — Google ignores them anyway.
✓ No special syntax: no quotes, no operators, no site: (that is added automatically).
✓ Output plain terms only — no rationale, no categories, just the search strings.

═══════════════════════════════════════════════
PATTERN GUIDE
═══════════════════════════════════════════════

Comparison / evaluation (highest intent):
  [Competitor] alternative
  [Competitor] vs [Competitor]
  best [category] [year or qualifier]
  [Competitor] alternatives [qualifier]

Pain / churn:
  [Competitor] too expensive
  [Competitor] pricing
  leaving [Competitor]
  [Competitor] problems

Category-level (high volume):
  best [category] small business
  [category] recommendation
  [category] software comparison

ICP-specific:
  best [category] for [ICP]
  [category] for [team type]

═══════════════════════════════════════════════
EXAMPLES (for a project management SaaS)
═══════════════════════════════════════════════

GOOD:
  ✓ Notion alternative
  ✓ ClickUp vs Notion
  ✓ best project management small business
  ✓ Asana too expensive
  ✓ leaving Monday.com
  ✓ project management software comparison
  ✓ best task manager remote team
  ✓ ClickUp pricing
  ✓ Asana alternative 2024

BAD:
  ✗ I am looking for a project management tool (too long, conversational)
  ✗ "best project management" (no quotes)
  ✗ project management site:reddit.com (no operators)
  ✗ task management tools for distributed engineering teams (too specific, low volume)

Generate 8–12 terms. Prioritize competitor-specific ones first.
`.trim();
}

function buildUserPrompt(project: ProjectDTO, competitors: CompetitorContext[]): string {
  const lines: string[] = [
    `Company: ${project.name}`,
  ];

  if (project.value_proposition) {
    lines.push(`Description: ${project.value_proposition.slice(0, 400)}`);
    lines.push("↑ Extract: product category, ICP, and which tools they replace.");
  }

  if (competitors.length > 0) {
    lines.push(`\nCompetitors: ${competitors.map((c) => c.name.replace(/\.[a-z]{2,}$/i, "")).join(", ")}`);
    lines.push("Generate at least 2 terms per competitor (alternative + pricing/problem).");
  } else {
    lines.push("\nNo competitors provided — infer likely ones from the description.");
  }

  lines.push("\nGenerate 8–12 short Google search terms for this company.");

  return lines.join("\n");
}

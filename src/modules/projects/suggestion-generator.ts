import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { Enums } from "@/db/schemas/database.types";
import type { ProjectDTO } from "@/db/schemas/domain";

const suggestionResponseSchema = z.object({
  keywords: z
    .array(
      z.object({
        term: z.string().trim().min(1).max(120),
        intentCategory: z.enum(["informational", "comparative", "transactional"]),
        rationale: z.string().trim().min(1).max(240),
      }),
    )
    .min(5)
    .max(20),
  subreddits: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        isRegional: z.boolean(),
        rationale: z.string().trim().min(1).max(240),
      }),
    )
    .min(3)
    .max(12),
});

export type CompetitorContext = {
  name: string;
  websiteUrl: string;
  websiteContent: string;
};

export type GeneratedProjectSuggestions = {
  keywords: {
    term: string;
    intentCategory: Enums<"intent_category">;
    rationale: string | null;
  }[];
  subreddits: {
    name: string;
    isRegional: boolean;
    rationale: string | null;
  }[];
  usage: {
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
  };
};

export async function generateProjectSuggestions(
  project: ProjectDTO,
  competitors: CompetitorContext[] = [],
): Promise<GeneratedProjectSuggestions> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const temperature = Number(process.env.OPENAI_SUGGESTIONS_TEMPERATURE ?? "0.2");
  const timeoutMs = Number(process.env.OPENAI_SUGGESTIONS_TIMEOUT_MS ?? "25000");
  const client = new OpenAI({ apiKey, timeout: timeoutMs });

  const response = await client.responses.parse(
    {
      model,
      temperature,
      instructions: buildSystemPrompt(),
      input: buildUserPrompt(project, competitors),
      max_output_tokens: 1_500,
      text: {
        format: zodTextFormat(suggestionResponseSchema, "project_onboarding_suggestions"),
      },
    },
    { timeout: timeoutMs },
  );

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("OpenAI returned no parsed suggestions");
  }

  return {
    keywords: normalizeKeywords(parsed.keywords),
    subreddits: normalizeSubreddits(parsed.subreddits),
    usage: {
      model,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    },
  };
}

function buildSystemPrompt(): string {
  return `
You are a Reddit lead generation specialist for B2B SaaS companies.

Your job: given a company's description and its competitors, generate short Reddit/Google
search queries and subreddits that will surface posts where real buyers are evaluating tools,
switching from competitors, or expressing pain — posts where this company's product is the answer.

═══════════════════════════════════════════════
KEYWORD FORMAT — MANDATORY
═══════════════════════════════════════════════

✓ Short: 2–6 words maximum. These are used as Reddit search queries and Google site:reddit.com searches.
✓ High intent: target people in evaluation or decision mode.
✓ No filler words: drop "I", "we", "the", "a".
✓ No quotes, no operators, no site: — just the raw search terms.
✓ Natural: match what a frustrated user actually types in a search bar.

═══════════════════════════════════════════════
FEW-SHOT EXAMPLES — STUDY THESE
═══════════════════════════════════════════════

For a hypothetical project management SaaS with competitors Asana, ClickUp, Notion:

--- BAD (do NOT generate) ---
  ✗ "struggling with project management tools" → too long, too vague
  ✗ "ClickUp too complicated for non-technical team" → too long, won't match as search query
  ✗ "streamline your workflow" → marketing copy, not a search query
  ✗ "my team needs better collaboration tools" → conversational, too long

--- GOOD (generate at this level) ---
  ✓ Notion alternative          → comparison, high intent
  ✓ ClickUp vs Notion           → direct evaluation
  ✓ Asana too expensive         → churn signal
  ✓ leaving Monday.com          → active switching
  ✓ ClickUp pricing             → pain signal
  ✓ best project management     → category-level, high volume
  ✓ Asana alternative           → competitor replacement
  ✓ project management small business → ICP-specific
  ✓ ClickUp problems            → dissatisfaction
  ✓ Asana vs ClickUp            → active comparison

--- BAD SUBREDDITS ---
  ✗ technology → too broad
  ✗ business → too broad

--- GOOD SUBREDDITS ---
  ✓ projectmanagement → direct ICP community
  ✓ marketing → discusses tools constantly
  ✓ clickup → competitor's user base = warm leads
  ✓ softwarerecommendations → explicit buying intent
  ✓ startups → evaluating tools, budget-conscious

═══════════════════════════════════════════════
KEYWORD PATTERNS — cover all 4
═══════════════════════════════════════════════

1. COMPETITOR COMPARISON (highest intent)
   "[Competitor] alternative", "[Competitor] vs [Competitor]", "leaving [Competitor]",
   "switch from [Competitor]", "best [category] alternative"

2. COMPETITOR PAIN / CHURN
   "[Competitor] too expensive", "[Competitor] pricing", "[Competitor] problems",
   "[Competitor] slow", "[Competitor] [missing feature]"

3. CATEGORY-LEVEL (high volume)
   "best [category]", "[category] recommendation", "[category] for [ICP]",
   "best [category] [team type]", "[category] software comparison"

4. BUYING INTENT
   "[category] recommendations", "looking for [category]", "[category] for [ICP role]"

Generate at least 2 terms per competitor (one comparison + one pain/churn).
Prioritize competitor-specific terms first.

═══════════════════════════════════════════════
SELF-EVALUATION — before finalizing output
═══════════════════════════════════════════════

Before returning your output, ask yourself:
  □ Is every keyword 2–6 words? No long phrases.
  □ Does each keyword target a real search someone would type?
  □ Are competitor names included prominently?
  □ Are the subreddits where the actual ICP hangs out?

If any answer is NO → revise before outputting.
`.trim();
}

function buildUserPrompt(project: ProjectDTO, competitors: CompetitorContext[]): string {
  const lines: string[] = [];

  lines.push("═══════════════════════════════════════");
  lines.push("COMPANY");
  lines.push("═══════════════════════════════════════");
  lines.push(`Name: ${project.name}`);
  lines.push(`Website: ${project.website_url ?? "not provided"}`);
  lines.push(`Region: ${project.region ?? "Global"}`);
  lines.push(`Primary Language: ${project.primary_language}`);
  lines.push(`IMPORTANT: Generate all keyword terms and rationale text in ${project.primary_language === "es" ? "Spanish" : project.primary_language === "pt" ? "Portuguese" : "English"}.`);

  if (project.value_proposition) {
    lines.push(`\nCompany Description (AI-analyzed from their website):\n${"─".repeat(40)}`);
    lines.push(project.value_proposition);
    lines.push("─".repeat(40));
    lines.push(
      "↑ Extract from this: (1) what specific problem they solve, " +
      "(2) who is the ICP — role, team size, industry, " +
      "(3) what workflows or tools they replace, " +
      "(4) the exact language their customers use to describe pain.",
    );
  }

  if (competitors.length > 0) {
    lines.push("\n═══════════════════════════════════════");
    lines.push("COMPETITORS");
    lines.push("═══════════════════════════════════════");
    lines.push(
      "For EACH competitor below, generate a dedicated block of keywords covering: " +
      "alternatives, comparisons, specific pain points, and churn signals. " +
      "Minimum 3 keywords per competitor — these are your highest-intent signals.",
    );

    for (const competitor of competitors) {
      lines.push(`\n── ${competitor.name.toUpperCase()} ──`);
      lines.push(`Website: ${competitor.websiteUrl}`);
      if (competitor.websiteContent) {
        lines.push(`Scraped Content:\n${"─".repeat(30)}`);
        lines.push(competitor.websiteContent.slice(0, 900));
        lines.push("─".repeat(30));
        lines.push(
          "↑ Use this to identify their specific weaknesses, pricing vulnerabilities, feature gaps, " +
          "and the language their users use to complain.",
        );
      }
    }

    const competitorNames = competitors.map((c) => c.name).join(", ");
    lines.push("\n═══════════════════════════════════════");
    lines.push("YOUR TASK");
    lines.push("═══════════════════════════════════════");
    lines.push(
      `Generate Reddit keywords and subreddits for ${project.name}.\n\n` +
      `MANDATORY competitor coverage: ${competitorNames}\n` +
      `→ Minimum 3 keywords per competitor. No exceptions.\n\n` +
      `Target posts where someone is:\n` +
      ` (a) frustrated with ${competitorNames} and looking for alternatives\n` +
      ` (b) actively comparing tools in this category for a specific use case\n` +
      ` (c) experiencing a pain that ${project.name} directly solves\n` +
      ` (d) asking peers for tool recommendations in a role-specific context\n\n` +
      `Quality bar: every keyword must pass the "would a sales rep recognize a buyer" test.\n` +
      `Reference the few-shot GOOD examples in the system prompt as your quality benchmark.`,
    );
  } else {
    lines.push("\n═══════════════════════════════════════");
    lines.push("YOUR TASK");
    lines.push("═══════════════════════════════════════");
    lines.push(
      `Generate Reddit keywords and subreddits for ${project.name}.\n\n` +
      `Infer likely competitors from the company description and cover each with at least 3 keywords.\n\n` +
      `Target posts where someone is:\n` +
      ` (a) frustrated with a competitor and looking for alternatives\n` +
      ` (b) actively comparing tools in this category for a specific use case\n` +
      ` (c) experiencing a pain that ${project.name} directly solves\n` +
      ` (d) asking peers for tool recommendations in a role-specific context\n\n` +
      `Quality bar: every keyword must pass the "would a sales rep recognize a buyer" test.\n` +
      `Reference the few-shot GOOD examples in the system prompt as your quality benchmark.`,
    );
  }

  return lines.join("\n");
}

function normalizeKeywords(
  keywords: z.infer<typeof suggestionResponseSchema>["keywords"],
): GeneratedProjectSuggestions["keywords"] {
  const seen = new Set<string>();

  return keywords
    .map((keyword) => ({
      term: keyword.term.trim().replace(/\s+/g, " "),
      intentCategory: keyword.intentCategory,
      rationale: keyword.rationale.trim(),
    }))
    .filter((keyword) => {
      const key = keyword.term.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeSubreddits(
  subreddits: z.infer<typeof suggestionResponseSchema>["subreddits"],
): GeneratedProjectSuggestions["subreddits"] {
  const seen = new Set<string>();

  return subreddits
    .map((subreddit) => ({
      name: subreddit.name.trim().replace(/^\/?r\//i, "").replace(/\s+/g, ""),
      isRegional: subreddit.isRegional,
      rationale: subreddit.rationale.trim(),
    }))
    .filter((subreddit) => {
      const key = subreddit.name.toLocaleLowerCase();
      if (key.length === 0 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

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

Your job: given a company's description and its competitors, generate Reddit keywords
and subreddits that will surface posts where real buyers are in pain, evaluating tools, or
complaining about competitors — posts where this company's product is the answer.

═══════════════════════════════════════════════
WHAT MAKES A GOOD KEYWORD (read this carefully)
═══════════════════════════════════════════════

Good keywords are:
  ✓ Specific to the company's actual use case and ICP
  ✓ Written in the natural language of a frustrated user typing in Reddit search
  ✓ Tied to a specific competitor, workflow, role, or pain — not a general category
  ✓ Actionable: a sales person reading the post would recognize a potential buyer

Bad keywords are:
  ✗ Generic category descriptions ("best project management software")
  ✗ Polished marketing copy ("streamline your workflow")
  ✗ Could apply to any tool in the category ("collaboration tool for teams")
  ✗ Too abstract to find a specific post ("productivity problems")

═══════════════════════════════════════════════
FEW-SHOT EXAMPLES — STUDY THESE
═══════════════════════════════════════════════

The following examples are for a hypothetical Work OS / project management tool
with competitors Asana, ClickUp, and Notion. Use this as a reference for the
QUALITY and SPECIFICITY level expected in your output.

--- BAD KEYWORDS (do NOT generate these) ---
  ✗ "struggling with project management tools" → too vague, no intent signal
  ✗ "best project management software for teams" → informational, not buyer-intent
  ✗ "my team needs better collaboration tools" → could be anything
  ✗ "manual updates are killing our productivity" → no competitor/tool reference
  ✗ "can't integrate my tools effectively" → generic, no specificity
  ✗ "hate the learning curve of new software" → applies to any software ever made

--- GOOD KEYWORDS (generate at this quality level) ---
  ✓ "ClickUp too complicated for non-technical team" → specific competitor + specific ICP pain
  ✓ "Asana vs monday for marketing agency" → role-specific comparison, high intent
  ✓ "notion database limitations project tracking" → specific feature gap of a competitor
  ✓ "monday.com per seat pricing scaling problem" → named product + specific pain (pricing)
  ✓ "asana automation rules not working" → named product + operational frustration
  ✓ "replacing spreadsheets for operations workflows" → workflow-specific, matches ICP
  ✓ "clickup overwhelmed onboarding new team members" → named competitor + adoption pain
  ✓ "work OS for non-technical operations team" → ICP-specific, matches product positioning
  ✓ "asana too rigid for cross-department projects" → named competitor + specific limitation
  ✓ "notion vs monday for team task management" → direct comparison, active evaluation

--- BAD SUBREDDITS ---
  ✗ technology → too broad, no buyer intent
  ✗ business → too broad
  ✗ productivity → consumers + professionals mixed, low signal

--- GOOD SUBREDDITS ---
  ✓ projectmanagement → direct ICP community
  ✓ marketing → agency ICP, discusses tools constantly
  ✓ operations → ops teams are core buyers
  ✓ clickup → competitor's user base = warm leads
  ✓ Asana → same — users with pain are considering alternatives
  ✓ startups → evaluating tools, budget-conscious, active discussions
  ✓ softwarerecommendations → explicit buying intent

═══════════════════════════════════════════════
KEYWORD CATEGORIES — generate all 5
═══════════════════════════════════════════════

1. PAIN-POINT KEYWORDS
   Specific operational frustrations tied to the company's use case or a named competitor.
   Must reference a concrete workflow, team type, or tool — not just a vague feeling.

2. BUYER-INTENT KEYWORDS
   Active evaluation signals: comparisons, "looking for", "recommend", "switching from".
   Must include the specific category and ideally a role or team type.

3. COMPETITOR KEYWORDS
   For each competitor you can infer from the company description:
     - "[Competitor] alternative for [specific use case]"
     - "[Competitor] vs [category term]"
     - "[Competitor] [specific pain]" (pricing, limits, learning curve, missing feature)
     - "switched from [Competitor] to"
   These are your highest-intent keywords. Cover every competitor you can identify.

4. ROLE / WORKFLOW KEYWORDS
   How the ICP describes their job in Reddit posts. Infer the ICP from the company description.
   Examples: "as a project manager", "our ops team uses", "managing client projects for agency"

5. CHURN / DISSATISFACTION KEYWORDS
   Signs an existing user of a competitor is ready to leave.
   Format: "[Competitor] [negative signal]" — pricing hike, missing feature, slow, buggy, etc.

═══════════════════════════════════════════════
SELF-EVALUATION — before finalizing output
═══════════════════════════════════════════════

Before returning your output, ask yourself:
  □ Could each keyword apply to a competitor's product too? If yes → make it more specific.
  □ Does each keyword contain at least one of: competitor name / role / specific feature / workflow?
  □ Would a sales rep reading the matched Reddit post recognize a potential buyer?
  □ Are the subreddits where the actual ICP (not general public) hangs out?

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

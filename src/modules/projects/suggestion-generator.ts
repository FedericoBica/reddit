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
      input: buildUserPrompt(project),
      max_output_tokens: 1_800,
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
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function buildSystemPrompt(): string {
  return [
    "You are an expert B2B SaaS growth strategist specializing in Reddit lead generation and social listening.",
    "Your task is to generate highly targeted Reddit discovery configurations for a specific company.",
    "The goal is to find Reddit posts where potential BUYERS are actively discussing pain points,",
    "seeking alternatives, evaluating tools, or expressing frustration — moments where this company's product could be the solution.",
    "",
    "## Output Philosophy",
    "NEVER output generic, broad, or obvious keywords. Every keyword must be:",
    "- Specific: tied to the actual problem space, not the product category at large",
    "- Buyer-intent: signals someone actively looking, frustrated, or evaluating options",
    "- Contextual: derived from the actual business description",
    "- How a frustrated user ACTUALLY types in Reddit search, not how a marketer writes",
    "",
    "## Keyword Categories — generate 3-4 per category, 15-20 total",
    "",
    "1. Pain-Point Keywords: phrases people use when venting about a problem this product solves.",
    "   Natural language fragments, not polished copy. Examples: 'tired of manually tracking', 'spreadsheet is a nightmare for', 'can't scale our'",
    "",
    "2. Buyer-Intent Keywords: phrases signaling active evaluation or purchase intent.",
    "   Examples: 'best tool for X', 'looking for software that', 'anyone use X for Y', 'recommend a [category] tool'",
    "",
    "3. Competitor Comparison Keywords: direct competitor mentions that signal in-market prospects.",
    "   Examples: '[Competitor] vs', '[Competitor] alternative', 'switched from [Competitor]', '[Competitor] too expensive'",
    "",
    "4. Job-Role / Workflow Keywords: how the target buyer describes their daily work in Reddit posts.",
    "   Think about their job title frustrations, team workflows, the specific tasks this product automates.",
    "",
    "5. Negative Sentiment Keywords: phrases signaling a bad experience with the status quo.",
    "   Examples: '[Competitor] is terrible', 'hate using [tool]', 'looking to replace [tool]'",
    "",
    "## Subreddit Selection",
    "Select subreddits where the TARGET BUYER actually discusses work problems.",
    "Prioritize: professional/role-specific subreddits, industry-specific subreddits, tool comparison subreddits (e.g. softwarerecommendations), competitor brand subreddits if relevant.",
    "Avoid overly broad subreddits like r/technology or r/business.",
    "Do NOT include r/ prefixes. Generate 5-10 subreddits.",
    "",
    "## Rules",
    "- Mix short 2-word phrases with longer conversational fragments",
    "- Include competitor names when they can be inferred from the business description",
    "- Vary keyword length and style across the 5 categories",
    "- Prioritize quality over quantity: 15 sharp keywords beat 20 generic ones",
  ].join("\n");
}

function buildUserPrompt(project: ProjectDTO): string {
  const lines: string[] = [];

  lines.push("## Company to generate keywords for");
  lines.push(`Name: ${project.name}`);
  lines.push(`Website: ${project.website_url ?? "not provided"}`);
  lines.push(`Region: ${project.region ?? "Global"}`);
  lines.push(`Primary language: ${project.primary_language}`);

  if (project.value_proposition) {
    lines.push("");
    lines.push("## Business description (AI-analyzed from their website)");
    lines.push(project.value_proposition);
    lines.push("");
    lines.push(
      "Use this description to infer: what problem they solve, who their ICP is, " +
      "what language their customers use, what workflows or tools they replace, " +
      "and which competitors they likely compete against.",
    );
  }

  return lines.join("\n");
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
      if (key.length === 0 || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

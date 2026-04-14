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
    .min(3)
    .max(12),
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
      instructions: [
        "You generate initial Reddit discovery configuration for a B2B SaaS lead monitoring product.",
        "Return practical, non-generic keywords and subreddit names only. Do not include r/ prefixes.",
        "Prefer buyer-intent, pain-point, and alternative/comparison keywords over broad category words.",
        "Respect the project's region and primary language when useful, but include global communities if relevant.",
      ].join("\n"),
      input: [
        `Project name: ${project.name}`,
        `Website URL: ${project.website_url ?? "not provided"}`,
        `Value proposition: ${project.value_proposition ?? "not provided"}`,
        `Region: ${project.region ?? "global / not provided"}`,
        `Primary language: ${project.primary_language}`,
      ].join("\n"),
      max_output_tokens: 1_200,
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

import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { XProfileDTO } from "@/db/schemas/domain";

export const X_POST_GENERATOR_VERSION = "v1";

const xPostSchema = z.object({
  content: z.string().trim().min(10).max(280),
  hook_explanation: z.string().trim().max(120),
});

export type GeneratedXPost = {
  content: string;
  hookExplanation: string;
  promptVersion: typeof X_POST_GENERATOR_VERSION;
};

export type XPostGenerationInput = {
  project: {
    name: string;
    website_url: string | null;
    value_proposition: string | null;
  };
  profile: XProfileDTO;
  angle?: string;
  topic?: string;
};

function buildSystemPrompt(profile: XProfileDTO): string {
  const parts: string[] = [
    `You write high-performing X (Twitter) posts for a SaaS founder or creator.`,
    ``,
    `Core rules:`,
    `- 280 chars max — every word earns its place`,
    `- First line is the hook — it must stop the scroll`,
    `- Write in first person, confident, direct`,
    `- No hashtags, no "🚀", no corporate speak`,
    `- Avoid starting with "I" — it's weaker`,
    `- No links unless the user specifies`,
    `- Sound like a human, not a brand`,
    ``,
    `Anti-patterns:`,
    `- "Excited to announce" — no one cares`,
    `- "Thread 🧵" — only if it's actually a thread`,
    `- Hollow questions like "What do you think?"`,
    `- Ending with "Follow me for more"`,
    `- Filler words: "really", "very", "just", "basically"`,
  ];

  if (profile.structure_types.length > 0) {
    parts.push(``, `Preferred structures: ${profile.structure_types.join(", ")}`);
  }

  if (profile.favorite_creators.length > 0) {
    parts.push(``, `Style reference: @${profile.favorite_creators.join(", @")} — study their tone and brevity.`);
  }

  if (profile.x_rules) {
    parts.push(``, `Additional rules from the creator:`, profile.x_rules);
  }

  return parts.join("\n");
}

function buildUserPrompt(input: XPostGenerationInput): string {
  const { project, profile, angle, topic } = input;

  const lines = [
    `Product: ${project.name}`,
    `Value proposition: ${project.value_proposition ?? "not provided"}`,
    `Website: ${project.website_url ?? "not provided"}`,
    `Creator interests: ${profile.interests.slice(0, 8).join(", ") || "not specified"}`,
    `Products to promote: ${profile.products.filter(Boolean).join(", ") || "none specified"}`,
  ];

  if (topic) lines.push(`Topic/angle: ${topic}`);
  if (angle) lines.push(`Writing angle: ${angle}`);

  lines.push(
    ``,
    `Write one high-performing X post (max 280 chars).`,
    `Return: content (the post text) and hook_explanation (why the hook works, max 120 chars).`,
  );

  return lines.join("\n");
}

export async function generateXPost(input: XPostGenerationInput): Promise<GeneratedXPost> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const response = await client.responses.parse({
    model,
    input: [
      { role: "system", content: buildSystemPrompt(input.profile) },
      { role: "user", content: buildUserPrompt(input) },
    ],
    text: { format: zodTextFormat(xPostSchema, "x_post") },
    temperature: 0.85,
    max_output_tokens: 200,
  });

  const parsed = response.output_parsed;
  if (!parsed) throw new Error("AI post generator returned no output.");

  return {
    content: parsed.content,
    hookExplanation: parsed.hook_explanation,
    promptVersion: X_POST_GENERATOR_VERSION,
  };
}

"use server";

import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { requireUser } from "@/modules/auth/server";

const postDraftSchema = z.object({
  titles: z.array(z.string().min(1)).min(1).max(3),
  body: z.string().min(50),
  linkPlacementTip: z.string().optional(),
});

export type PostDraft = {
  titles: string[];
  body: string;
  linkPlacementTip?: string;
  subreddit: string;
  style: string;
};

export type GenerateDraftResult =
  | { success: true; draft: PostDraft }
  | { success: false; error: string };

const STYLE_DESCRIPTIONS: Record<string, string> = {
  case_study:
    "Case Study: Share a real success story with concrete data, timeline, and measurable results. Be specific — no vague claims.",
  tutorial:
    "Tutorial: Explain step by step how to solve a specific problem the reader has. Make it immediately actionable.",
  controversial:
    "Controversial Opinion: Present a contrarian take that challenges conventional wisdom. Back it with solid arguments, not hot air.",
};

export async function generatePostDraft(formData: FormData): Promise<GenerateDraftResult> {
  await requireUser("/content-lab");

  const subreddit = String(formData.get("subreddit") ?? "").trim();
  const style = String(formData.get("style") ?? "tutorial");
  const topic = String(formData.get("topic") ?? "").trim();
  const valueProposition = String(formData.get("valueProposition") ?? "").trim();

  if (!subreddit) {
    return { success: false, error: "Seleccioná un subreddit." };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OpenAI API key no configurada." };
  }

  try {
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const client = new OpenAI({ apiKey, timeout: 40_000 });

    const response = await client.responses.parse({
      model,
      temperature: 0.75,
      instructions: [
        "You are an expert in Reddit community management and organic content marketing.",
        "Write in a conversational, human style — no marketing jargon, no buzzwords.",
        "The goal is to genuinely add value to the community. Posts should feel authentic.",
        "Never sound promotional. If a product link is inserted, it must feel natural and helpful.",
        "Write in English unless the topic or subreddit signals otherwise.",
      ].join(" "),
      input: [
        `Target subreddit: r/${subreddit}`,
        `Post style: ${STYLE_DESCRIPTIONS[style] ?? STYLE_DESCRIPTIONS.tutorial}`,
        topic ? `Topic/angle: ${topic}` : null,
        valueProposition ? `Product context (use subtly): ${valueProposition}` : null,
        "",
        "Return:",
        "1. titles: array of 3 title options optimized for upvotes (concise, curiosity-driven, no clickbait)",
        "2. body: full post draft in Markdown, 500-800 words, human-like tone",
        "3. linkPlacementTip: one sentence on where/how to insert the product URL organically (optional)",
      ]
        .filter(Boolean)
        .join("\n"),
      max_output_tokens: 1_800,
      text: { format: zodTextFormat(postDraftSchema, "post_draft") },
    });

    const parsed = response.output_parsed;
    if (!parsed) {
      return { success: false, error: "La IA no pudo generar el borrador." };
    }

    return {
      success: true,
      draft: {
        titles: parsed.titles,
        body: parsed.body,
        linkPlacementTip: parsed.linkPlacementTip,
        subreddit,
        style,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al generar el borrador.",
    };
  }
}

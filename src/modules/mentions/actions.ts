"use server";

import OpenAI from "openai";
import { requireUser } from "@/modules/auth/server";
import { assertAiReplyGenerationAvailable, recordAiReplyGeneration } from "@/modules/billing/reply-generation";
import { getBrandMentionById } from "@/db/queries/brand-mentions";
import { getProjectById } from "@/db/queries/projects";

export type MentionReplyState = {
  error: string | null;
  replies: string[];
  usageLabel: string | null;
};

export async function generateMentionRepliesAction(
  _prevState: MentionReplyState,
  formData: FormData,
): Promise<MentionReplyState> {
  const user = await requireUser("/mentions");
  const projectId = String(formData.get("projectId") ?? "");
  const mentionId = String(formData.get("mentionId") ?? "");

  try {
    const usage = await assertAiReplyGenerationAvailable(user.id);
    const [project, mention] = await Promise.all([
      getProjectById(projectId),
      getBrandMentionById(projectId, mentionId),
    ]);

    if (!project || !mention) {
      return {
        error: "Could not load the selected mention.",
        replies: [],
        usageLabel: null,
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        error: "OPENAI_API_KEY is not configured.",
        replies: [],
        usageLabel: null,
      };
    }

    const client = new OpenAI({
      apiKey,
      timeout: Number(process.env.OPENAI_REPLY_TIMEOUT_MS ?? "30000"),
    });
    const model = process.env.OPENAI_REPLY_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const styles = [
      { key: "engaging", instruction: "Be warm, observant, and low-pressure." },
      { key: "direct", instruction: "Be concise, practical, and explicit about fit." },
      { key: "balanced", instruction: "Lead with value, then mention the product naturally." },
    ];

    const replies = await Promise.all(
      styles.map(async (style) => {
        const response = await client.responses.create({
          model,
          temperature: 0.5,
          max_output_tokens: 220,
          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text:
                    "Write a Reddit reply for a SaaS founder/operator. Sound human, concrete, and non-spammy. Add value first. If the product is not a natural fit, avoid forcing it. Do not use hype, sales clichés, or say you are an AI.",
                },
              ],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: [
                    `Project: ${project.name}`,
                    `Website: ${project.website_url ?? "n/a"}`,
                    `Value proposition: ${project.value_proposition ?? "n/a"}`,
                    `Tone guidance: ${project.tone ?? "n/a"}`,
                    `Mention target: ${mention.target_label}`,
                    `Mention sentiment: ${mention.sentiment}`,
                    `Mention title: ${mention.title}`,
                    `Mention body: ${mention.body ?? "No body available."}`,
                    `Sentiment rationale: ${mention.sentiment_reason ?? "n/a"}`,
                    `Style: ${style.key}. ${style.instruction}`,
                    "Return only the final Reddit reply text.",
                  ].join("\n"),
                },
              ],
            },
          ],
        });

        return response.output_text.trim();
      }),
    );

    await recordAiReplyGeneration(projectId, user.id, "mention");

    const nextUsed = usage.used + 1;
    const usageLabel = usage.limit === null ? `${nextUsed} used this month` : `${nextUsed}/${usage.limit} used this month`;

    return {
      error: null,
      replies,
      usageLabel,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to generate replies.",
      replies: [],
      usageLabel: null,
    };
  }
}

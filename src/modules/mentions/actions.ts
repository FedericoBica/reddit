"use server";

import Anthropic from "@anthropic-ai/sdk";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/modules/auth/server";
import { assertAiReplyGenerationAvailable, recordAiReplyGeneration } from "@/modules/billing/reply-generation";
import { updateBrandMentionStatus } from "@/db/mutations/brand-mentions";
import { getBrandMentionById } from "@/db/queries/brand-mentions";
import { getProjectById } from "@/db/queries/projects";
import { toReplyGenerationUiError } from "@/modules/replies/error-messages";

export async function updateMentionStatusFromForm(formData: FormData) {
  await requireUser("/feed");
  const projectId = String(formData.get("projectId") ?? "");
  const mentionId = String(formData.get("mentionId") ?? "");
  const status = String(formData.get("status") ?? "") as "new" | "replied";
  const returnTo = String(formData.get("returnTo") ?? "");
  if (!projectId || !mentionId || !["new", "replied"].includes(status)) return;
  await updateBrandMentionStatus(projectId, mentionId, status);
  revalidatePath("/feed");
  revalidatePath("/archive/replied");
  if (returnTo) redirect(returnTo);
}

export type MentionReplyState = {
  error: string | null;
  canRetry: boolean;
  replies: string[];
  usageLabel: string | null;
};

function lengthInstruction(length: string): string {
  if (length === "short") {
    return "SHORT: 1-2 sentences maximum. Pick the single most relevant point. No warm-up, no closing — just the point.";
  }
  if (length === "long") {
    return "LONG: 6-10 sentences across 2-3 paragraphs. Go deeper, add context and a concrete tip. Still sound human — not a blog post.";
  }
  return "MEDIUM: 3-5 sentences. Get to the point fast, include one concrete observation, mention product if it fits naturally.";
}

export async function generateMentionRepliesAction(
  _prevState: MentionReplyState,
  formData: FormData,
): Promise<MentionReplyState> {
  const user = await requireUser("/mentions");
  const tErrors = await getTranslations("errors");
  const projectId = String(formData.get("projectId") ?? "");
  const mentionId = String(formData.get("mentionId") ?? "");
  const replyLength = String(formData.get("replyLength") ?? "medium");

  try {
    const usage = await assertAiReplyGenerationAvailable(user.id);
    const [project, mention] = await Promise.all([
      getProjectById(projectId),
      getBrandMentionById(projectId, mentionId),
    ]);

    if (!project || !mention) {
      return {
        error: tErrors("mentionNotFound"),
        canRetry: false,
        replies: [],
        usageLabel: null,
      };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        error: tErrors("configuration"),
        canRetry: false,
        replies: [],
        usageLabel: null,
      };
    }

    const client = new Anthropic({
      apiKey,
      timeout: Number(process.env.OPENAI_REPLY_TIMEOUT_MS ?? "30000"),
    });
    const model = process.env.ANTHROPIC_REPLY_MODEL ?? "claude-sonnet-4-6";
    const styles = [
      { key: "engaging", instruction: "Be warm, observant, and low-pressure." },
      { key: "direct", instruction: "Be concise, practical, and explicit about fit." },
      { key: "balanced", instruction: "Lead with value, then mention the product naturally." },
    ];

    const replies = await Promise.all(
      styles.map(async (style) => {
        const response = await client.messages.create({
          model,
          max_tokens: 220,
          system:
            "Write a Reddit reply for a SaaS founder/operator. Sound human, concrete, and non-spammy. Add value first. If the product is not a natural fit, avoid forcing it. Do not use hype, sales clichés, or say you are an AI. Return only the final Reddit reply text.",
          messages: [
            {
              role: "user",
              content: [
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
                `Length: ${lengthInstruction(replyLength)}`,
                "Return only the final Reddit reply text.",
              ].join("\n"),
            },
          ],
        });

        const textBlock = response.content.find((b) => b.type === "text");
        return textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
      }),
    );

    await recordAiReplyGeneration(projectId, user.id, "mention");

    const nextUsed = usage.used + 1;
    const usageLabel = usage.limit === null ? `${nextUsed} used this month` : `${nextUsed}/${usage.limit} used this month`;

    return {
      error: null,
      canRetry: true,
      replies,
      usageLabel,
    };
  } catch (error) {
    const uiError = toReplyGenerationUiError(error);
    return {
      error: tErrors(uiError.kind),
      canRetry: uiError.canRetry,
      replies: [],
      usageLabel: null,
    };
  }
}

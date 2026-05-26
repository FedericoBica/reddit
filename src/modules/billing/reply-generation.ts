import "server-only";

import { logOpenAIUsage } from "@/db/mutations/api-usage";
import {
  getAiReplyUsageForUser,
  getBillingPlanForUser,
  type AiReplyUsage,
} from "@/modules/billing/current";

export class AiReplyLimitReachedError extends Error {
  constructor(
    public readonly used: number,
    public readonly limit: number,
  ) {
    super(`AI reply limit reached for this month (${used}/${limit}).`);
    this.name = "AiReplyLimitReachedError";
  }
}

export async function assertAiReplyGenerationAvailable(userId: string): Promise<AiReplyUsage> {
  const plan = await getBillingPlanForUser(userId);
  const usage = await getAiReplyUsageForUser(userId, plan);

  if (usage.limit !== null && usage.used >= usage.limit) {
    throw new AiReplyLimitReachedError(usage.used, usage.limit);
  }

  return usage;
}

export async function recordAiReplyGeneration(
  projectId: string,
  userId: string,
  source: "lead" | "mention",
) {
  await logOpenAIUsage({
    projectId,
    userId,
    operation: source === "mention" ? "mention_reply_generation" : "lead_reply_generation",
    metadata: {
      source,
    },
  });
}

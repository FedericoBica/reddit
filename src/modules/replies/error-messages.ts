import { AiReplyLimitReachedError } from "@/modules/billing/reply-generation";

export type ReplyGenerationUiError = {
  kind: "limit" | "temporary" | "configuration";
  message: string;
  canRetry: boolean;
};

export function toReplyGenerationUiError(error: unknown): ReplyGenerationUiError {
  if (error instanceof AiReplyLimitReachedError) {
    return {
      kind: "limit",
      message: `You reached your monthly AI reply limit (${error.used}/${error.limit}). Upgrade your plan or wait until next month to generate more replies.`,
      canRetry: false,
    };
  }

  const rawMessage =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const message = rawMessage.trim().toLowerCase();

  if (
    message.includes("ai reply limit reached")
    || (message.includes("monthly") && message.includes("limit"))
  ) {
    return {
      kind: "limit",
      message: rawMessage || "You reached your monthly AI reply limit. Upgrade your plan or wait until next month to generate more replies.",
      canRetry: false,
    };
  }

  if (
    message.includes("anthropic_api_key")
    || message.includes("openai_api_key")
    || message.includes("not configured")
  ) {
    return {
      kind: "configuration",
      message: "AI reply generation is temporarily unavailable. Please try again later.",
      canRetry: false,
    };
  }

  return {
    kind: "temporary",
    message: "We couldn't generate replies right now. Please try again.",
    canRetry: true,
  };
}

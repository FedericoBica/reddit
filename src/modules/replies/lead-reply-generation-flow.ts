import type { ReplyGenerationUiError } from "@/modules/replies/error-messages";
import { toReplyGenerationUiError } from "@/modules/replies/error-messages";

type LeadReplyGenerationDeps = {
  assertAvailable: () => Promise<void>;
  dispatchGeneration: () => Promise<void>;
  failGeneration: (message: string) => Promise<void>;
  recordUsage: () => Promise<void>;
  requestGeneration: () => Promise<boolean>;
};

export type LeadReplyGenerationOutcome =
  | { status: "limit_reached"; error: ReplyGenerationUiError }
  | { status: "not_queued" }
  | { status: "dispatch_failed"; error: ReplyGenerationUiError }
  | { status: "dispatched" };

export async function executeLeadReplyGenerationFlow(
  deps: LeadReplyGenerationDeps,
): Promise<LeadReplyGenerationOutcome> {
  try {
    await deps.assertAvailable();
  } catch (error) {
    const uiError = toReplyGenerationUiError(error);
    await deps.failGeneration(uiError.message);
    return { status: "limit_reached", error: uiError };
  }

  const queued = await deps.requestGeneration();
  if (!queued) return { status: "not_queued" };

  try {
    await deps.dispatchGeneration();
    await deps.recordUsage();
    return { status: "dispatched" };
  } catch (error) {
    const uiError = toReplyGenerationUiError(error);
    await deps.failGeneration(uiError.message);
    return { status: "dispatch_failed", error: uiError };
  }
}

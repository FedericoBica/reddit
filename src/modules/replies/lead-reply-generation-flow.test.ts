import assert from "node:assert/strict";
import test from "node:test";
import { AiReplyLimitReachedError } from "@/modules/billing/reply-generation";
import { executeLeadReplyGenerationFlow } from "./lead-reply-generation-flow";

test("executeLeadReplyGenerationFlow stops early when the monthly quota is reached", async () => {
  let requestCalled = false;
  let recordCalled = false;
  let dispatchCalled = false;
  let failedMessage = "";

  const outcome = await executeLeadReplyGenerationFlow({
    assertAvailable: async () => {
      throw new AiReplyLimitReachedError(100, 100);
    },
    dispatchGeneration: async () => {
      dispatchCalled = true;
    },
    failGeneration: async (message) => {
      failedMessage = message;
    },
    recordUsage: async () => {
      recordCalled = true;
    },
    requestGeneration: async () => {
      requestCalled = true;
      return true;
    },
  });

  assert.equal(outcome.status, "limit_reached");
  assert.equal(outcome.error.kind, "limit");
  assert.equal(outcome.error.canRetry, false);
  assert.equal(
    failedMessage,
    "You reached your monthly AI reply limit (100/100). Upgrade your plan or wait until next month to generate more replies.",
  );
  assert.equal(requestCalled, false);
  assert.equal(recordCalled, false);
  assert.equal(dispatchCalled, false);
});

test("executeLeadReplyGenerationFlow records a friendly failure when Inngest dispatch fails", async () => {
  const steps: string[] = [];
  let failedMessage = "";

  const outcome = await executeLeadReplyGenerationFlow({
    assertAvailable: async () => {
      steps.push("assert");
    },
    dispatchGeneration: async () => {
      steps.push("dispatch");
      throw new Error("socket hang up");
    },
    failGeneration: async (message) => {
      steps.push("fail");
      failedMessage = message;
    },
    recordUsage: async () => {
      steps.push("record");
    },
    requestGeneration: async () => {
      steps.push("request");
      return true;
    },
  });

  assert.equal(outcome.status, "dispatch_failed");
  assert.equal(outcome.error.kind, "temporary");
  assert.equal(outcome.error.canRetry, true);
  assert.equal(
    failedMessage,
    "We couldn't generate replies right now. Please try again.",
  );
  assert.deepEqual(steps, ["assert", "request", "dispatch", "fail"]);
});

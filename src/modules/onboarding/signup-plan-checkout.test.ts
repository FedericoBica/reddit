import assert from "node:assert/strict";
import test from "node:test";
import { createSignupPlanCheckoutRedirect } from "./signup-plan-checkout";

test("createSignupPlanCheckoutRedirect returns null when hosted checkout creation fails", async () => {
  const redirectUrl = await createSignupPlanCheckoutRedirect({
    appUrl: "https://app.prowlit.com",
    createCheckout: async () => {
      throw new Error("Paddle is down");
    },
    email: "founder@example.com",
    plan: "growth",
    projectId: "project-123",
    userId: "user-123",
  });

  assert.equal(redirectUrl, null);
});

test("createSignupPlanCheckoutRedirect builds the hosted checkout success URL for paid plans", async () => {
  let receivedSuccessUrl = "";

  const redirectUrl = await createSignupPlanCheckoutRedirect({
    appUrl: "https://app.prowlit.com",
    createCheckout: async (input) => {
      receivedSuccessUrl = input.successUrl;
      return "https://checkout.paddle.test/session";
    },
    email: "founder@example.com",
    plan: "professional",
    projectId: "project-123",
    userId: "user-123",
  });

  assert.equal(redirectUrl, "https://checkout.paddle.test/session");
  assert.equal(
    receivedSuccessUrl,
    "https://app.prowlit.com/dashboard?projectId=project-123&checkout=success",
  );
});

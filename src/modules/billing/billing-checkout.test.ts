import assert from "node:assert/strict";
import test from "node:test";
import { determineBillingRedirectUrl, resolveBillingCheckoutAction } from "./billing-checkout";

const noop = async () => {};
const stubbedCheckout = async () => "https://checkout.paddle.test/session";

test("resolveBillingCheckoutAction calls updateSubscription when subscription exists", async () => {
  let calledWith: { id: string; plan: string } | null = null;

  const result = await resolveBillingCheckoutAction({
    targetPlan: "professional",
    subscriptionId: "sub_existing_123",
    email: "user@example.com",
    successUrl: "https://app.example.com/settings?tab=billing",
    customData: { user_id: "user-1", billing_plan: "professional" },
    updateSubscription: async (id, plan) => {
      calledWith = { id, plan };
    },
    createCheckout: async () => {
      throw new Error("createCheckout must not be called when subscription exists");
    },
  });

  assert.equal(result.action, "updated");
  assert.equal((result as { action: "updated"; subscriptionId: string }).subscriptionId, "sub_existing_123");
  assert.deepEqual(calledWith, { id: "sub_existing_123", plan: "professional" });
});

test("resolveBillingCheckoutAction creates a new checkout when no subscription exists", async () => {
  const calls: Array<{ billingPlan: string; email: string }> = [];

  const result = await resolveBillingCheckoutAction({
    targetPlan: "growth",
    subscriptionId: null,
    email: "newuser@example.com",
    successUrl: "https://app.example.com/settings?tab=billing&checkout=started",
    customData: { user_id: "user-2", billing_plan: "growth" },
    updateSubscription: async () => {
      throw new Error("updateSubscription must not be called without an existing subscription");
    },
    createCheckout: async (input) => {
      calls.push({ billingPlan: input.billingPlan, email: input.email });
      return "https://checkout.paddle.test/new-session";
    },
  });

  assert.equal(result.action, "checkout");
  assert.equal((result as { action: "checkout"; url: string }).url, "https://checkout.paddle.test/new-session");
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.billingPlan, "growth");
  assert.equal(calls[0]?.email, "newuser@example.com");
});

test("resolveBillingCheckoutAction propagates Paddle errors from updateSubscription", async () => {
  await assert.rejects(
    () =>
      resolveBillingCheckoutAction({
        targetPlan: "growth",
        subscriptionId: "sub_bad",
        email: "user@example.com",
        successUrl: "https://app.example.com/settings",
        customData: {},
        updateSubscription: async () => {
          throw new Error("Paddle: subscription not found");
        },
        createCheckout: stubbedCheckout,
      }),
    /Paddle: subscription not found/,
  );
});

// ── determineBillingRedirectUrl (server action redirect logic) ───────────────

test("determineBillingRedirectUrl returns result.url when a new checkout is created", async () => {
  const url = await determineBillingRedirectUrl({
    targetPlan: "growth",
    subscriptionId: null,
    email: "user@example.com",
    successUrl: "https://app.example.com/settings?tab=billing&checkout=started&plan=growth",
    customData: { user_id: "user-1", billing_plan: "growth" },
    updateSubscription: noop,
    createCheckout: async () => "https://checkout.paddle.test/new-session",
  });

  assert.equal(url, "https://checkout.paddle.test/new-session");
});

test("determineBillingRedirectUrl returns successUrl when an existing subscription is updated", async () => {
  const successUrl = "https://app.example.com/settings?tab=billing&checkout=started&plan=professional";

  const url = await determineBillingRedirectUrl({
    targetPlan: "professional",
    subscriptionId: "sub_existing_123",
    email: "user@example.com",
    successUrl,
    customData: { user_id: "user-1", billing_plan: "professional" },
    updateSubscription: noop,
    createCheckout: stubbedCheckout,
  });

  assert.equal(url, successUrl);
});

test("resolveBillingCheckoutAction propagates Paddle errors from createCheckout", async () => {
  await assert.rejects(
    () =>
      resolveBillingCheckoutAction({
        targetPlan: "growth",
        subscriptionId: null,
        email: "user@example.com",
        successUrl: "https://app.example.com/settings",
        customData: {},
        updateSubscription: noop,
        createCheckout: async () => {
          throw new Error("Paddle: invalid price ID");
        },
      }),
    /Paddle: invalid price ID/,
  );
});

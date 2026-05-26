import assert from "node:assert/strict";
import test from "node:test";
import { resolveEffectivePlan } from "./subscription-plan-resolver";

// ── subscription.activated (paid signup webhook path) ────────────────────────

test("resolveEffectivePlan sets growth when subscription.activated with growth price", () => {
  const plan = resolveEffectivePlan({
    currentPlan: "startup",
    mappedPlan: "growth",
    status: "active",
    eventName: "subscription.activated",
  });
  assert.equal(plan, "growth");
});

test("resolveEffectivePlan sets professional when subscription.activated with professional price", () => {
  const plan = resolveEffectivePlan({
    currentPlan: "startup",
    mappedPlan: "professional",
    status: "active",
    eventName: "subscription.activated",
  });
  assert.equal(plan, "professional");
});

// ── subscription.updated (plan change webhook) ───────────────────────────────

test("resolveEffectivePlan downgrades to startup on subscription.updated with startup price", () => {
  const plan = resolveEffectivePlan({
    currentPlan: "professional",
    mappedPlan: "startup",
    status: "active",
    eventName: "subscription.updated",
  });
  assert.equal(plan, "startup");
});

test("resolveEffectivePlan upgrades from growth to professional on subscription.updated", () => {
  const plan = resolveEffectivePlan({
    currentPlan: "growth",
    mappedPlan: "professional",
    status: "active",
    eventName: "subscription.updated",
  });
  assert.equal(plan, "professional");
});

// ── cancellation ─────────────────────────────────────────────────────────────
// All plans are paid — cancel means no active plan (null), never downgrade to startup.

test("resolveEffectivePlan returns null when status is canceled", () => {
  const plan = resolveEffectivePlan({
    currentPlan: "professional",
    mappedPlan: "professional",
    status: "canceled",
    eventName: "subscription.updated",
  });
  assert.equal(plan, null);
});

test("resolveEffectivePlan returns null on subscription.canceled event regardless of status", () => {
  const plan = resolveEffectivePlan({
    currentPlan: "growth",
    mappedPlan: "growth",
    status: "active",
    eventName: "subscription.canceled",
  });
  assert.equal(plan, null);
});

// ── unknown price ID (Paddle sends webhook for unknown price) ────────────────

test("resolveEffectivePlan preserves current paid plan when price ID is not recognized", () => {
  const plan = resolveEffectivePlan({
    currentPlan: "professional",
    mappedPlan: null,
    status: "active",
    eventName: "subscription.updated",
  });
  assert.equal(plan, "professional");
});

test("resolveEffectivePlan falls back to startup when price is unknown and current plan is startup", () => {
  const plan = resolveEffectivePlan({
    currentPlan: "startup",
    mappedPlan: null,
    status: "active",
    eventName: "subscription.updated",
  });
  assert.equal(plan, "startup");
});

import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import {
  verifyPaddleWebhookSignature,
  detectXAddonInItems,
  mapPaddlePriceIdToBillingPlan,
} from "./paddle";
import { applyXAddon, getProjectLimitForPlan } from "./limits";
import { assertSubscriptionOwnership } from "./subscription-ownership";

// ── helpers ──────────────────────────────────────────────────────────────────

function buildPaddleSignature(secret: string, ts: string, body: string): string {
  const digest = crypto.createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");
  return `ts=${ts};h1=${digest}`;
}

// ── verifyPaddleWebhookSignature ─────────────────────────────────────────────

test("verifyPaddleWebhookSignature returns true for a correctly signed payload", () => {
  process.env.PADDLE_WEBHOOK_SECRET = "secret-correct";
  const body = '{"event_type":"subscription.activated","data":{"id":"sub_1"}}';
  const ts = "1700000000";
  const sig = buildPaddleSignature("secret-correct", ts, body);
  assert.equal(verifyPaddleWebhookSignature(body, sig), true);
});

test("verifyPaddleWebhookSignature returns false when signature was created with a different secret", () => {
  process.env.PADDLE_WEBHOOK_SECRET = "secret-correct";
  const body = '{"event_type":"subscription.activated"}';
  const sig = buildPaddleSignature("secret-wrong", "1700000000", body);
  assert.equal(verifyPaddleWebhookSignature(body, sig), false);
});

test("verifyPaddleWebhookSignature returns false when the body has been tampered", () => {
  process.env.PADDLE_WEBHOOK_SECRET = "secret-tamper";
  const original = '{"event_type":"subscription.activated"}';
  const tampered = '{"event_type":"subscription.activated","injected":true}';
  const sig = buildPaddleSignature("secret-tamper", "1700000000", original);
  assert.equal(verifyPaddleWebhookSignature(tampered, sig), false);
});

test("verifyPaddleWebhookSignature returns false for null signature header", () => {
  process.env.PADDLE_WEBHOOK_SECRET = "secret-null";
  assert.equal(verifyPaddleWebhookSignature("{}", null), false);
});

test("verifyPaddleWebhookSignature returns false for malformed signature (no ts/h1 parts)", () => {
  process.env.PADDLE_WEBHOOK_SECRET = "secret-malformed";
  assert.equal(verifyPaddleWebhookSignature("{}", "notavalidsig"), false);
});

// ── detectXAddonInItems ──────────────────────────────────────────────────────

test("detectXAddonInItems returns false when items is undefined", () => {
  assert.equal(detectXAddonInItems(undefined), false);
});

test("detectXAddonInItems returns false when items is empty", () => {
  assert.equal(detectXAddonInItems([]), false);
});

test("detectXAddonInItems returns false when no item price matches a known X addon ID", () => {
  process.env.PADDLE_PRICE_ID_X_ADDON_GROWTH = "pri_x_growth";
  assert.equal(detectXAddonInItems([{ price: { id: "pri_base_growth" } }]), false);
});

test("detectXAddonInItems returns true when an item matches PADDLE_PRICE_ID_X_ADDON_GROWTH", () => {
  process.env.PADDLE_PRICE_ID_X_ADDON_GROWTH = "pri_x_growth_match";
  assert.equal(detectXAddonInItems([
    { price: { id: "pri_base_growth" } },
    { price: { id: "pri_x_growth_match" } },
  ]), true);
});

test("detectXAddonInItems returns true when item matches PADDLE_PRICE_ID_X_ADDON_PROFESSIONAL", () => {
  process.env.PADDLE_PRICE_ID_X_ADDON_PROFESSIONAL = "pri_x_pro";
  assert.equal(detectXAddonInItems([{ price: { id: "pri_x_pro" } }]), true);
});

test("detectXAddonInItems returns false when all X addon env vars are unset", () => {
  delete process.env.PADDLE_PRICE_ID_X_ADDON_STARTUP;
  delete process.env.PADDLE_PRICE_ID_X_ADDON_GROWTH;
  delete process.env.PADDLE_PRICE_ID_X_ADDON_PROFESSIONAL;
  assert.equal(detectXAddonInItems([{ price: { id: "pri_anything" } }]), false);
});

// ── mapPaddlePriceIdToBillingPlan ────────────────────────────────────────────

test("mapPaddlePriceIdToBillingPlan returns 'startup' for PADDLE_PRICE_ID_STARTUP", () => {
  process.env.PADDLE_PRICE_ID_STARTUP = "pri_startup_001";
  assert.equal(mapPaddlePriceIdToBillingPlan("pri_startup_001"), "startup");
});

test("mapPaddlePriceIdToBillingPlan returns 'growth' for PADDLE_PRICE_ID_GROWTH", () => {
  process.env.PADDLE_PRICE_ID_GROWTH = "pri_growth_001";
  assert.equal(mapPaddlePriceIdToBillingPlan("pri_growth_001"), "growth");
});

test("mapPaddlePriceIdToBillingPlan returns 'professional' for PADDLE_PRICE_ID_PROFESSIONAL", () => {
  process.env.PADDLE_PRICE_ID_PROFESSIONAL = "pri_professional_001";
  assert.equal(mapPaddlePriceIdToBillingPlan("pri_professional_001"), "professional");
});

test("mapPaddlePriceIdToBillingPlan returns null for an unrecognized price ID", () => {
  assert.equal(mapPaddlePriceIdToBillingPlan("pri_unknown_xyz"), null);
});

test("mapPaddlePriceIdToBillingPlan returns null for null input", () => {
  assert.equal(mapPaddlePriceIdToBillingPlan(null), null);
});

test("mapPaddlePriceIdToBillingPlan returns null for undefined input", () => {
  assert.equal(mapPaddlePriceIdToBillingPlan(undefined), null);
});

// ── applyXAddon / X entitlement ──────────────────────────────────────────────

test("applyXAddon enables X on the growth plan with correct keyword limits", () => {
  const base = getProjectLimitForPlan("growth");
  assert.equal(base.xEnabled, true);
  const withAddon = applyXAddon(base);
  assert.equal(withAddon.xEnabled, true);
  assert.equal(withAddon.maxXKeywords, 15);
  assert.equal(withAddon.maxXPostsPerDay, 30);
  assert.equal(withAddon.plan, "growth");
  assert.equal(withAddon.maxAiRepliesPerMonth, base.maxAiRepliesPerMonth);
});

test("applyXAddon enables X on the startup plan and sets keyword limits", () => {
  const base = getProjectLimitForPlan("startup");
  assert.equal(base.xEnabled, false);
  const withAddon = applyXAddon(base);
  assert.equal(withAddon.xEnabled, true);
  assert.equal(withAddon.maxXKeywords, 7);
  assert.equal(withAddon.maxXPostsPerDay, 15);
});

test("applyXAddon enables X on the professional plan with maximum limits", () => {
  const base = getProjectLimitForPlan("professional");
  const withAddon = applyXAddon(base);
  assert.equal(withAddon.xEnabled, true);
  assert.equal(withAddon.maxXKeywords, 30);
  assert.equal(withAddon.maxXPostsPerDay, 50);
});

test("applyXAddon does not modify other plan fields", () => {
  const base = getProjectLimitForPlan("growth");
  const withAddon = applyXAddon(base);
  assert.equal(withAddon.maxKeywords, base.maxKeywords);
  assert.equal(withAddon.maxAiRepliesPerMonth, base.maxAiRepliesPerMonth);
  assert.equal(withAddon.maxTeamMembers, base.maxTeamMembers);
});

// ── assertSubscriptionOwnership ──────────────────────────────────────────────

test("assertSubscriptionOwnership does not throw when IDs match", () => {
  assert.doesNotThrow(() => assertSubscriptionOwnership("sub_abc123", "sub_abc123"));
});

test("assertSubscriptionOwnership throws when submitted ID differs from owned", () => {
  assert.throws(
    () => assertSubscriptionOwnership("sub_abc123", "sub_different"),
    /does not belong/,
  );
});

test("assertSubscriptionOwnership throws when owned ID is null", () => {
  assert.throws(
    () => assertSubscriptionOwnership(null, "sub_abc123"),
    /does not belong/,
  );
});

test("assertSubscriptionOwnership throws when owned ID is undefined", () => {
  assert.throws(
    () => assertSubscriptionOwnership(undefined, "sub_abc123"),
    /does not belong/,
  );
});

test("assertSubscriptionOwnership throws when owned ID is empty string", () => {
  assert.throws(
    () => assertSubscriptionOwnership("", "sub_abc123"),
    /does not belong/,
  );
});

import "server-only";

import crypto from "node:crypto";
import { requireEnv } from "@/lib/env";
import type { BillingPlan } from "@/modules/billing/limits";

function getPaddleApiBase() {
  return process.env.PADDLE_ENVIRONMENT === "sandbox"
    ? "https://sandbox-api.paddle.com"
    : "https://api.paddle.com";
}

function getApiHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${requireEnv("PADDLE_API_KEY")}`,
  };
}

async function paddleRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getPaddleApiBase()}${path}`, {
    ...init,
    headers: {
      ...getApiHeaders(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const json = await response.json() as {
    data: T;
    error?: { detail?: string; code?: string };
  };

  if (!response.ok) {
    const message =
      json.error?.detail ??
      json.error?.code ??
      `Paddle request failed with status ${response.status}`;
    throw new Error(message);
  }

  return json.data;
}

export function getPaddlePriceIdForPlan(plan: BillingPlan) {
  const mapping: Record<BillingPlan, string> = {
    startup: requireEnv("PADDLE_PRICE_ID_STARTUP"),
    growth: requireEnv("PADDLE_PRICE_ID_GROWTH"),
    professional: requireEnv("PADDLE_PRICE_ID_PROFESSIONAL"),
  };
  return mapping[plan];
}

export function getXAddonPriceIdForPlan(plan: BillingPlan): string {
  const mapping: Record<BillingPlan, string> = {
    startup: requireEnv("PADDLE_PRICE_ID_X_ADDON_STARTUP"),
    growth: requireEnv("PADDLE_PRICE_ID_X_ADDON_GROWTH"),
    professional: requireEnv("PADDLE_PRICE_ID_X_ADDON_PROFESSIONAL"),
  };
  return mapping[plan];
}

export function detectXAddonInItems(items: Array<{ price?: { id?: string } }> | undefined): boolean {
  if (!items) return false;
  const xAddonPrices = new Set(
    [
      process.env.PADDLE_PRICE_ID_X_ADDON_STARTUP,
      process.env.PADDLE_PRICE_ID_X_ADDON_GROWTH,
      process.env.PADDLE_PRICE_ID_X_ADDON_PROFESSIONAL,
    ].filter(Boolean),
  );
  return items.some((item) => item.price?.id && xAddonPrices.has(item.price.id));
}

export function mapPaddlePriceIdToBillingPlan(priceId: string | null | undefined): BillingPlan | null {
  if (!priceId) return null;
  if (priceId === process.env.PADDLE_PRICE_ID_STARTUP) return "startup";
  if (priceId === process.env.PADDLE_PRICE_ID_GROWTH) return "growth";
  if (priceId === process.env.PADDLE_PRICE_ID_PROFESSIONAL) return "professional";
  return null;
}


type PaddleCustomerAuthTokenData = {
  customer_auth_token: string;
};

export async function updatePaddleSubscription(
  subscriptionId: string,
  plan: BillingPlan,
  xAddonEnabled = false,
): Promise<void> {
  const items: Array<{ price_id: string; quantity: number }> = [
    { price_id: getPaddlePriceIdForPlan(plan), quantity: 1 },
  ];
  if (xAddonEnabled) {
    items.push({ price_id: getXAddonPriceIdForPlan(plan), quantity: 1 });
  }
  await paddleRequest<unknown>(`/subscriptions/${subscriptionId}`, {
    method: "PATCH",
    body: JSON.stringify({ items, proration_billing_mode: "prorated_immediately" }),
  });
}

type PaddleSubscriptionData = {
  id: string;
  status: string;
  customer_id?: string;
  next_billed_at?: string | null;
  current_billing_period?: { ends_at?: string | null } | null;
  trial_dates?: { ends_at?: string | null } | null;
  items?: Array<{ price?: { id?: string } }>;
};

export async function getPaddleSubscription(subscriptionId: string): Promise<PaddleSubscriptionData> {
  return paddleRequest<PaddleSubscriptionData>(`/subscriptions/${subscriptionId}`);
}

export async function getPaddleCustomerPortalUrl(customerId: string): Promise<string | null> {
  try {
    const data = await paddleRequest<PaddleCustomerAuthTokenData>(
      `/customers/${customerId}/auth-token`,
      { method: "POST" },
    );
    const base =
      process.env.PADDLE_ENVIRONMENT === "sandbox"
        ? "https://sandbox-customer.paddle.com"
        : "https://customer.paddle.com";
    return `${base}?token=${data.customer_auth_token}`;
  } catch {
    return null;
  }
}

export function verifyPaddleWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const secret = requireEnv("PADDLE_WEBHOOK_SECRET");
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => {
      const idx = p.indexOf("=");
      return [p.slice(0, idx), p.slice(idx + 1)] as [string, string];
    }),
  );
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(`${ts}:${rawBody}`)
    .digest("hex");

  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(h1, "utf8");
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

export function hashBillingPayload(rawBody: string) {
  return crypto.createHash("sha256").update(rawBody).digest("hex");
}

export type PaddleWebhookPayload = {
  event_id?: string;
  event_type?: string;
  notification_id?: string;
  data?: {
    id?: string;
    customer_id?: string;
    status?: string;
    items?: Array<{ price?: { id?: string } }>;
    custom_data?: Record<string, unknown> | null;
    next_billed_at?: string | null;
    current_billing_period?: { ends_at?: string | null } | null;
    scheduled_change?: { action?: string; effective_at?: string | null } | null;
    trial_dates?: { ends_at?: string | null } | null;
  };
};

export function parsePaddleWebhookPayload(rawBody: string): PaddleWebhookPayload {
  return JSON.parse(rawBody) as PaddleWebhookPayload;
}

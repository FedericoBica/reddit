import "server-only";

import crypto from "node:crypto";
import { requireEnv } from "@/lib/env";
import type { BillingPlan } from "@/modules/billing/limits";

type LemonSqueezyJsonApi<T> = {
  data: T;
  errors?: Array<{ detail?: string; title?: string; status?: string }>;
};

type LemonSqueezyCheckoutResponse = {
  id: string;
  type: "checkouts";
  attributes: {
    url: string;
  };
};

type LemonSqueezySubscriptionResponse = {
  id: string;
  type: "subscriptions";
  attributes: {
    status: string;
    variant_id: number | string | null;
    variant_name: string | null;
    product_name: string | null;
    user_email: string | null;
    urls?: {
      customer_portal?: string | null;
      update_payment_method?: string | null;
      update_customer_portal?: string | null;
    };
  };
};

type LemonSqueezyWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown> | null;
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: Record<string, unknown>;
  };
};

const API_BASE_URL = "https://api.lemonsqueezy.com/v1";

function getApiHeaders() {
  return {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    Authorization: `Bearer ${requireEnv("LEMON_SQUEEZY_API_KEY")}`,
  };
}

async function lemonSqueezyRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getApiHeaders(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const json = await response.json() as LemonSqueezyJsonApi<T>;

  if (!response.ok) {
    const message = json.errors?.map((error) => error.detail ?? error.title ?? error.status).filter(Boolean).join("; ")
      || `Lemon Squeezy request failed with status ${response.status}`;
    throw new Error(message);
  }

  return json.data;
}

export function getLemonSqueezyStoreId() {
  return requireEnv("LEMON_SQUEEZY_STORE_ID");
}

export function getLemonSqueezyVariantIdForPlan(plan: BillingPlan) {
  const mapping: Record<BillingPlan, string> = {
    startup: requireEnv("LEMON_SQUEEZY_VARIANT_ID_STARTUP"),
    growth: requireEnv("LEMON_SQUEEZY_VARIANT_ID_GROWTH"),
    professional: requireEnv("LEMON_SQUEEZY_VARIANT_ID_PROFESSIONAL"),
  };

  return mapping[plan];
}

export function isLemonSqueezyTestModeEnabled() {
  return process.env.LEMON_SQUEEZY_TEST_MODE === "true";
}

export function mapLemonVariantToBillingPlan(input: {
  variantId?: string | number | null;
  variantName?: string | null;
  productName?: string | null;
}): BillingPlan | null {
  const normalizedVariantId = input.variantId == null ? null : String(input.variantId);

  if (normalizedVariantId) {
    if (normalizedVariantId === process.env.LEMON_SQUEEZY_VARIANT_ID_STARTUP) return "startup";
    if (normalizedVariantId === process.env.LEMON_SQUEEZY_VARIANT_ID_GROWTH) return "growth";
    if (normalizedVariantId === process.env.LEMON_SQUEEZY_VARIANT_ID_PROFESSIONAL) return "professional";
  }

  const haystack = `${input.variantName ?? ""} ${input.productName ?? ""}`.toLowerCase();
  if (haystack.includes("startup")) return "startup";
  if (haystack.includes("growth")) return "growth";
  if (haystack.includes("professional") || haystack.includes("pro")) return "professional";

  return null;
}

export async function createLemonSqueezyCheckout(input: {
  billingPlan: BillingPlan;
  email: string;
  name?: string | null;
  redirectUrl: string;
  custom: Record<string, unknown>;
}) {
  const data = await lemonSqueezyRequest<LemonSqueezyCheckoutResponse>("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: input.email,
            name: input.name ?? undefined,
            custom: input.custom,
          },
          checkout_options: {
            embed: false,
          },
          product_options: {
            enabled_variants: [Number(getLemonSqueezyVariantIdForPlan(input.billingPlan))],
            redirect_url: input.redirectUrl,
          },
          test_mode: isLemonSqueezyTestModeEnabled(),
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: getLemonSqueezyStoreId(),
            },
          },
          variant: {
            data: {
              type: "variants",
              id: getLemonSqueezyVariantIdForPlan(input.billingPlan),
            },
          },
        },
      },
    }),
  });

  return data.attributes.url;
}

export async function retrieveLemonSqueezySubscription(subscriptionId: string) {
  return lemonSqueezyRequest<LemonSqueezySubscriptionResponse>(`/subscriptions/${subscriptionId}`);
}

export async function getSignedCustomerPortalUrl(subscriptionId: string) {
  const subscription = await retrieveLemonSqueezySubscription(subscriptionId);
  return subscription.attributes.urls?.customer_portal ?? null;
}

export function getUnsignedCustomerPortalUrl() {
  const customDomain = process.env.LEMON_SQUEEZY_STORE_CUSTOM_DOMAIN?.trim();
  if (customDomain) {
    return `https://${customDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "")}/billing`;
  }

  const subdomain = process.env.LEMON_SQUEEZY_STORE_SUBDOMAIN?.trim();
  if (subdomain) {
    return `https://${subdomain}.lemonsqueezy.com/billing`;
  }

  return null;
}

export function verifyLemonSqueezyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;

  const digest = crypto
    .createHmac("sha256", requireEnv("LEMON_SQUEEZY_WEBHOOK_SECRET"))
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(signature, "utf8");

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

export function hashBillingPayload(rawBody: string) {
  return crypto.createHash("sha256").update(rawBody).digest("hex");
}

export function parseLemonSqueezyWebhookPayload(rawBody: string) {
  return JSON.parse(rawBody) as LemonSqueezyWebhookPayload;
}

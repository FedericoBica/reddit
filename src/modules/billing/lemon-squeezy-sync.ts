import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/db/schemas/database.types";
import type { BillingPlan } from "@/modules/billing/limits";
import {
  hashBillingPayload,
  mapLemonVariantToBillingPlan,
  parseLemonSqueezyWebhookPayload,
} from "@/modules/billing/lemon-squeezy";

type BillingSubscriptionAttributes = {
  store_id?: number | string | null;
  customer_id?: number | string | null;
  order_id?: number | string | null;
  order_item_id?: number | string | null;
  product_id?: number | string | null;
  variant_id?: number | string | null;
  product_name?: string | null;
  variant_name?: string | null;
  user_email?: string | null;
  status?: string | null;
  renews_at?: string | null;
  ends_at?: string | null;
  trial_ends_at?: string | null;
  first_subscription_item?: {
    id?: number | string | null;
  } | null;
};

type BillingUserRecord = {
  id: string;
  email: string;
  billing_plan: string;
};

export async function syncLemonSqueezyBillingWebhook(rawBody: string) {
  const payloadHash = hashBillingPayload(rawBody);
  const payload = parseLemonSqueezyWebhookPayload(rawBody);
  const eventName = payload.meta?.event_name ?? "unknown";
  const resourceType = payload.data?.type ?? "unknown";
  const resourceId = payload.data?.id ?? "unknown";
  const supabase = createSupabaseAdminClient();

  const { error: dedupeError } = await supabase
    .from("billing_webhook_events")
    .insert({
      event_name: eventName,
      resource_type: resourceType,
      resource_id: resourceId,
      payload_hash: payloadHash,
      payload: payload as never,
    });

  if (dedupeError) {
    if (dedupeError.code === "23505") {
      return { deduped: true as const, eventName };
    }

    throw new Error(`Failed to persist billing webhook event: ${dedupeError.message}`);
  }

  if (resourceType === "subscriptions" && payload.data?.attributes) {
    await syncSubscriptionPayload({
      eventName,
      subscriptionId: resourceId,
      attributes: payload.data.attributes as BillingSubscriptionAttributes,
      customData: payload.meta?.custom_data ?? null,
    });
  }

  return { deduped: false as const, eventName };
}

async function syncSubscriptionPayload(input: {
  eventName: string;
  subscriptionId: string;
  attributes: BillingSubscriptionAttributes;
  customData: Record<string, unknown> | null;
}) {
  const supabase = createSupabaseAdminClient();
  const user = await findBillingUserForSubscription({
    customData: input.customData,
    customerId: input.attributes.customer_id,
    email: input.attributes.user_email,
    subscriptionId: input.subscriptionId,
  });

  if (!user) {
    return;
  }

  const mappedPlan = mapLemonVariantToBillingPlan({
    variantId: input.attributes.variant_id,
    variantName: input.attributes.variant_name,
    productName: input.attributes.product_name,
  });
  const effectivePlan = resolveEffectivePlan({
    currentPlan: user.billing_plan,
    mappedPlan,
    status: input.attributes.status,
    eventName: input.eventName,
  });

  const update: Database["public"]["Tables"]["users"]["Update"] = {
    billing_plan: effectivePlan,
    lemonsqueezy_customer_id: stringifyOrNull(input.attributes.customer_id),
    lemonsqueezy_subscription_id: input.subscriptionId,
    lemonsqueezy_order_id: stringifyOrNull(input.attributes.order_id),
    lemonsqueezy_product_id: stringifyOrNull(input.attributes.product_id),
    lemonsqueezy_variant_id: stringifyOrNull(input.attributes.variant_id),
    lemonsqueezy_subscription_status: input.attributes.status ?? null,
    lemonsqueezy_subscription_item_id: stringifyOrNull(input.attributes.first_subscription_item?.id),
    lemonsqueezy_subscription_renews_at: input.attributes.renews_at ?? null,
    lemonsqueezy_subscription_ends_at: input.attributes.ends_at ?? null,
    lemonsqueezy_trial_ends_at: input.attributes.trial_ends_at ?? null,
  };

  const { error } = await supabase
    .from("users")
    .update(update)
    .eq("id", user.id);

  if (error) {
    throw new Error(`Failed to sync Lemon Squeezy subscription: ${error.message}`);
  }
}

async function findBillingUserForSubscription(input: {
  customData: Record<string, unknown> | null;
  customerId?: string | number | null;
  email?: string | null;
  subscriptionId: string;
}): Promise<BillingUserRecord | null> {
  const supabase = createSupabaseAdminClient();
  const customUserId = typeof input.customData?.user_id === "string" ? input.customData.user_id : null;

  if (customUserId) {
    const { data } = await supabase
      .from("users")
      .select("id, email, billing_plan")
      .eq("id", customUserId)
      .maybeSingle();

    if (data) return data;
  }

  const customerId = stringifyOrNull(input.customerId);
  if (customerId) {
    const { data } = await supabase
      .from("users")
      .select("id, email, billing_plan")
      .eq("lemonsqueezy_customer_id", customerId)
      .maybeSingle();

    if (data) return data;
  }

  const { data: bySubscription } = await supabase
    .from("users")
    .select("id, email, billing_plan")
    .eq("lemonsqueezy_subscription_id", input.subscriptionId)
    .maybeSingle();

  if (bySubscription) return bySubscription;

  if (input.email) {
    const { data } = await supabase
      .from("users")
      .select("id, email, billing_plan")
      .eq("email", input.email)
      .maybeSingle();

    if (data) return data;
  }

  return null;
}

function resolveEffectivePlan(input: {
  currentPlan: string;
  mappedPlan: BillingPlan | null;
  status?: string | null;
  eventName: string;
}): BillingPlan {
  const normalizedStatus = (input.status ?? "").toLowerCase();
  const shouldDowngrade = normalizedStatus === "expired" || input.eventName === "subscription_expired";

  if (shouldDowngrade) {
    return "startup";
  }

  if (input.mappedPlan) {
    return input.mappedPlan;
  }

  if (input.currentPlan === "growth" || input.currentPlan === "professional") {
    return input.currentPlan;
  }

  return "startup";
}

function stringifyOrNull(value: string | number | null | undefined) {
  return value == null ? null : String(value);
}

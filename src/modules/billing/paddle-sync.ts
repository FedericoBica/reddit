import "server-only";

import { inngest } from "@/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/db/schemas/database.types";
import type { BillingPlan } from "@/modules/billing/limits";
import {
  hashBillingPayload,
  mapPaddlePriceIdToBillingPlan,
  parsePaddleWebhookPayload,
  detectXAddonInItems,
} from "@/modules/billing/paddle";
import { resolveEffectivePlan } from "@/modules/billing/subscription-plan-resolver";

type BillingUserRecord = {
  id: string;
  email: string;
  billing_plan: string | null;
};

export async function syncPaddleBillingWebhook(rawBody: string) {
  const payloadHash = hashBillingPayload(rawBody);
  const payload = parsePaddleWebhookPayload(rawBody);
  const eventName = payload.event_type ?? "unknown";
  const resourceId = payload.data?.id ?? payload.event_id ?? "unknown";
  const supabase = createSupabaseAdminClient();

  const { error: dedupeError } = await supabase
    .from("billing_webhook_events")
    .insert({
      event_name: eventName,
      resource_type: "subscriptions",
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

  if (payload.data?.id && eventName.startsWith("subscription.")) {
    await syncSubscriptionPayload({
      eventName,
      subscriptionId: payload.data.id,
      data: payload.data,
    });
  }

  return { deduped: false as const, eventName };
}

async function syncSubscriptionPayload(input: {
  eventName: string;
  subscriptionId: string;
  data: NonNullable<ReturnType<typeof parsePaddleWebhookPayload>["data"]>;
}) {
  const supabase = createSupabaseAdminClient();
  const user = await findBillingUserForSubscription({
    customData: input.data.custom_data ?? null,
    customerId: input.data.customer_id,
    subscriptionId: input.subscriptionId,
  });

  if (!user) {
    console.error(
      "[billing] paddle webhook: no user matched for subscription",
      { subscriptionId: input.subscriptionId, eventName: input.eventName, customerId: input.data.customer_id },
    );
    await inngest.send({
      name: "billing/webhook.orphaned",
      data: {
        subscriptionId: input.subscriptionId,
        eventName: input.eventName,
        customerId: input.data.customer_id ?? null,
      },
    });
    return;
  }

  const allItems = input.data.items ?? [];
  // Base plan is identified by the first non-X-addon price ID
  const basePriceId = allItems.find(
    (item) => item.price?.id && !detectXAddonInItems([item])
  )?.price?.id ?? null;
  const mappedPlan = mapPaddlePriceIdToBillingPlan(basePriceId);
  const xAddonEnabled = detectXAddonInItems(allItems);
  const effectivePlan = resolveEffectivePlan({
    currentPlan: user.billing_plan,
    mappedPlan,
    status: input.data.status,
    eventName: input.eventName,
  });

  // null means no active subscription — store null so the app knows to block access.
  const update: Database["public"]["Tables"]["users"]["Update"] = {
    billing_plan: effectivePlan ?? null,
    x_addon_enabled: effectivePlan ? xAddonEnabled : false,
    paddle_customer_id: input.data.customer_id ?? null,
    paddle_subscription_id: input.subscriptionId,
    paddle_price_id: basePriceId,
    paddle_subscription_status: input.data.status ?? null,
    paddle_subscription_renews_at: input.data.next_billed_at ?? null,
    paddle_subscription_ends_at: input.data.current_billing_period?.ends_at ?? null,
    paddle_trial_ends_at: input.data.trial_dates?.ends_at ?? null,
  };

  const { error } = await supabase.from("users").update(update).eq("id", user.id);

  if (error) {
    throw new Error(`Failed to sync Paddle subscription: ${error.message}`);
  }
}

async function findBillingUserForSubscription(input: {
  customData: Record<string, unknown> | null;
  customerId?: string | null;
  subscriptionId: string;
}): Promise<BillingUserRecord | null> {
  const supabase = createSupabaseAdminClient();
  const customUserId =
    typeof input.customData?.user_id === "string" ? input.customData.user_id : null;

  if (customUserId) {
    const { data } = await supabase
      .from("users")
      .select("id, email, billing_plan")
      .eq("id", customUserId)
      .maybeSingle();
    if (data) return data;
  }

  if (input.customerId) {
    const { data } = await supabase
      .from("users")
      .select("id, email, billing_plan")
      .eq("paddle_customer_id", input.customerId)
      .maybeSingle();
    if (data) return data;
  }

  const { data } = await supabase
    .from("users")
    .select("id, email, billing_plan")
    .eq("paddle_subscription_id", input.subscriptionId)
    .maybeSingle();

  return data ?? null;
}


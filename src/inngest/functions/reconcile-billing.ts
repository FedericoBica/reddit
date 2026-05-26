import "server-only";

import { inngest } from "@/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getPaddleSubscription,
  mapPaddlePriceIdToBillingPlan,
  detectXAddonInItems,
} from "@/modules/billing/paddle";
import { resolveEffectivePlan } from "@/modules/billing/subscription-plan-resolver";
import type { Database } from "@/db/schemas/database.types";

export const reconcileBilling = inngest.createFunction(
  {
    id: "reconcile-billing",
    name: "Daily billing reconciliation against Paddle API",
    retries: 1,
    triggers: [{ cron: "0 6 * * *" }],
  },
  async ({ step }) => {
    const supabase = createSupabaseAdminClient();

    const users = await step.run("load-users-with-subscriptions", async () => {
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, billing_plan, x_addon_enabled, paddle_subscription_id, paddle_subscription_status, paddle_price_id, paddle_customer_id, paddle_subscription_renews_at, paddle_subscription_ends_at, paddle_trial_ends_at",
        )
        .not("paddle_subscription_id", "is", null);

      if (error) throw new Error(`Failed to load users: ${error.message}`);
      return data ?? [];
    });

    if (users.length === 0) return { checked: 0, fixed: 0 };

    let fixed = 0;

    for (const user of users) {
      const result = await step.run(`reconcile-${user.id}`, async () => {
        let subscription: Awaited<ReturnType<typeof getPaddleSubscription>>;
        try {
          subscription = await getPaddleSubscription(user.paddle_subscription_id!);
        } catch (err) {
          console.error("[reconcile-billing] failed to fetch subscription from Paddle", {
            userId: user.id,
            subscriptionId: user.paddle_subscription_id,
            err,
          });
          return { skipped: true };
        }

        const basePriceId =
          subscription.items?.find(
            (item) => item.price?.id && !detectXAddonInItems([item]),
          )?.price?.id ?? null;

        const mappedPlan = mapPaddlePriceIdToBillingPlan(basePriceId);
        const xAddonEnabled = detectXAddonInItems(subscription.items);

        const effectivePlan = resolveEffectivePlan({
          currentPlan: user.billing_plan,
          mappedPlan,
          status: subscription.status,
          eventName: "subscription.updated",
        });

        // Mirror exactly what paddle-sync writes on every webhook event.
        const update: Database["public"]["Tables"]["users"]["Update"] = {
          billing_plan: effectivePlan ?? null,
          x_addon_enabled: effectivePlan ? xAddonEnabled : false,
          paddle_customer_id: subscription.customer_id ?? null,
          paddle_price_id: basePriceId,
          paddle_subscription_status: subscription.status,
          paddle_subscription_renews_at: subscription.next_billed_at ?? null,
          paddle_subscription_ends_at: subscription.current_billing_period?.ends_at ?? null,
          paddle_trial_ends_at: subscription.trial_dates?.ends_at ?? null,
        };

        // Exit early only if every field we would write already matches what's in the DB.
        const alreadyCorrect =
          user.billing_plan === update.billing_plan &&
          (user.x_addon_enabled ?? false) === update.x_addon_enabled &&
          (user.paddle_customer_id ?? null) === update.paddle_customer_id &&
          (user.paddle_price_id ?? null) === update.paddle_price_id &&
          (user.paddle_subscription_status ?? null) === update.paddle_subscription_status &&
          (user.paddle_subscription_renews_at ?? null) === update.paddle_subscription_renews_at &&
          (user.paddle_subscription_ends_at ?? null) === update.paddle_subscription_ends_at &&
          (user.paddle_trial_ends_at ?? null) === update.paddle_trial_ends_at;

        if (alreadyCorrect) return { changed: false };

        console.warn("[reconcile-billing] correcting desync", {
          userId: user.id,
          localPlan: user.billing_plan,
          paddlePlan: effectivePlan,
          localXAddon: user.x_addon_enabled,
          paddleXAddon: update.x_addon_enabled,
          paddleStatus: subscription.status,
        });

        const { error } = await supabase.from("users").update(update).eq("id", user.id);
        if (error) throw new Error(`Failed to update user ${user.id}: ${error.message}`);
        return { changed: true, from: user.billing_plan, to: effectivePlan };
      });

      if (typeof result === "object" && "changed" in result && result.changed) fixed++;
    }

    return { checked: users.length, fixed };
  },
);

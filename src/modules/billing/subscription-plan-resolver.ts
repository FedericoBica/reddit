import type { BillingPlan } from "@/modules/billing/limits";

// Returns null when the subscription is canceled — the user has no active plan.
// All three plans (startup/growth/professional) are paid; there is no free tier.
export function resolveEffectivePlan(input: {
  currentPlan: string | null;
  mappedPlan: BillingPlan | null;
  status?: string | null;
  eventName: string;
}): BillingPlan | null {
  const isCanceled =
    (input.status ?? "").toLowerCase() === "canceled" ||
    input.eventName === "subscription.canceled";

  if (isCanceled) return null;
  if (input.mappedPlan) return input.mappedPlan;
  if (input.currentPlan === "growth" || input.currentPlan === "professional" || input.currentPlan === "startup") {
    return input.currentPlan as BillingPlan;
  }
  return null;
}

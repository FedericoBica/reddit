import type { BillingPlan } from "@/modules/billing/limits";

type CreateCheckoutInput = {
  billingPlan: BillingPlan;
  email: string;
  successUrl: string;
  customData: Record<string, unknown>;
};

type UpdateSubscription = (subscriptionId: string, plan: BillingPlan) => Promise<void>;
type CreateCheckout = (input: CreateCheckoutInput) => Promise<string>;

export type BillingCheckoutResult =
  | { action: "updated"; subscriptionId: string }
  | { action: "checkout"; url: string };

export async function determineBillingRedirectUrl(input: {
  targetPlan: BillingPlan;
  subscriptionId: string | null;
  email: string;
  successUrl: string;
  customData: Record<string, unknown>;
  updateSubscription: UpdateSubscription;
  createCheckout: CreateCheckout;
}): Promise<string> {
  const result = await resolveBillingCheckoutAction(input);
  return result.action === "updated" ? input.successUrl : result.url;
}

export async function resolveBillingCheckoutAction(input: {
  targetPlan: BillingPlan;
  subscriptionId: string | null;
  email: string;
  successUrl: string;
  customData: Record<string, unknown>;
  updateSubscription: UpdateSubscription;
  createCheckout: CreateCheckout;
}): Promise<BillingCheckoutResult> {
  if (input.subscriptionId) {
    await input.updateSubscription(input.subscriptionId, input.targetPlan);
    return { action: "updated", subscriptionId: input.subscriptionId };
  }

  const url = await input.createCheckout({
    billingPlan: input.targetPlan,
    email: input.email,
    successUrl: input.successUrl,
    customData: input.customData,
  });
  return { action: "checkout", url };
}

import type { BillingPlan } from "@/modules/billing/limits";

type CreateCheckoutInput = {
  billingPlan: BillingPlan;
  email: string;
  successUrl: string;
  customData: {
    user_id: string;
    project_id: string | null;
    billing_plan: BillingPlan;
  };
};

type CreateCheckout = (input: CreateCheckoutInput) => Promise<string>;

export async function createSignupPlanCheckoutRedirect(input: {
  appUrl: string;
  createCheckout: CreateCheckout;
  email: string;
  plan: BillingPlan;
  projectId: string;
  userId: string;
}): Promise<string | null> {
  if (input.plan !== "growth" && input.plan !== "professional") {
    return null;
  }

  try {
    const successUrl = input.projectId
      ? `${input.appUrl}/dashboard?projectId=${input.projectId}&checkout=success`
      : `${input.appUrl}/signup/company?checkout=success`;

    return await input.createCheckout({
      billingPlan: input.plan,
      email: input.email,
      successUrl,
      customData: {
        user_id: input.userId,
        project_id: input.projectId || null,
        billing_plan: input.plan,
      },
    });
  } catch {
    return null;
  }
}

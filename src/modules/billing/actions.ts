"use server";

import { redirect } from "next/navigation";
import { requireEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/server";
import { parseBillingPlan, type BillingPlan } from "@/modules/billing/limits";
import {
  getPaddleCustomerPortalUrl,
  updatePaddleSubscription,
} from "@/modules/billing/paddle";
import { assertSubscriptionOwnership } from "@/modules/billing/subscription-ownership";

// Called from PaddleCheckoutButton when the user already has an active subscription.
// New subscriptions are handled client-side by Paddle.js.
export async function updateBillingSubscriptionFromForm(formData: FormData) {
  const user = await requireUser("/settings?tab=billing");
  const plan = parseBillingPlan(String(formData.get("plan") ?? ""));
  if (!plan) throw new Error("Invalid billing plan");
  const subscriptionId = String(formData.get("subscriptionId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const xAddonEnabled = formData.get("xAddon") === "true";

  if (!subscriptionId) {
    throw new Error("subscriptionId is required to update a subscription");
  }

  // Load billing data and verify the submitted subscription belongs to this user
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase
    .from("users")
    .select("x_addon_enabled, paddle_subscription_id")
    .eq("id", user.id)
    .single();

  assertSubscriptionOwnership(userData?.paddle_subscription_id, subscriptionId);

  const effectiveXAddon = formData.has("xAddon") ? xAddonEnabled : (userData?.x_addon_enabled ?? false);

  await updatePaddleSubscription(subscriptionId, plan, effectiveXAddon);

  redirect(buildBillingRedirectUrl(projectId, `checkout=started&plan=${plan}`));
}

export async function toggleXAddonFromForm(formData: FormData) {
  const user = await requireUser("/settings?tab=billing");
  const projectId = String(formData.get("projectId") ?? "").trim();
  const enable = formData.get("enable") === "true";

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("billing_plan, paddle_subscription_id")
    .eq("id", user.id)
    .single();

  if (error || !data) throw new Error("Failed to load user billing data");

  const plan = parseBillingPlan(data.billing_plan);
  if (!plan) throw new Error("No active subscription.");

  const subscriptionId = data.paddle_subscription_id;
  if (!subscriptionId) throw new Error("No active subscription ID found.");

  await updatePaddleSubscription(subscriptionId, plan, enable);

  redirect(buildBillingRedirectUrl(projectId, `xAddon=${enable}`));
}

export async function openBillingPortalFromForm(formData: FormData) {
  await requireUser("/settings?tab=billing");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/settings?tab=billing");
  }

  const { data, error } = await supabase
    .from("users")
    .select("paddle_customer_id")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(`Failed to load billing info: ${error.message}`);
  }

  if (data.paddle_customer_id) {
    const portalUrl = await getPaddleCustomerPortalUrl(data.paddle_customer_id);
    if (portalUrl) redirect(portalUrl);
  }

  const fallbackUrl =
    process.env.PADDLE_ENVIRONMENT === "sandbox"
      ? "https://sandbox-customer.paddle.com"
      : "https://customer.paddle.com";

  redirect(fallbackUrl);
}

function buildBillingRedirectUrl(projectId: string, extraQuery: string) {
  const appUrl = requireEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
  const query = new URLSearchParams({ tab: "billing" });

  if (projectId) {
    query.set("projectId", projectId);
  }

  extraQuery
    .split("&")
    .filter(Boolean)
    .forEach((pair) => {
      const [key, value = ""] = pair.split("=");
      query.set(key, value);
    });

  return `${appUrl}/settings?${query.toString()}`;
}

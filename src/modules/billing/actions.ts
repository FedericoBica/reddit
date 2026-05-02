"use server";

import { redirect } from "next/navigation";
import { requireEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/server";
import { parseBillingPlan, type BillingPlan } from "@/modules/billing/limits";
import {
  createLemonSqueezyCheckout,
  getSignedCustomerPortalUrl,
  getUnsignedCustomerPortalUrl,
} from "@/modules/billing/lemon-squeezy";

export async function beginBillingCheckoutFromForm(formData: FormData) {
  const user = await requireUser("/settings?tab=billing");
  const plan = parseBillingPlan(String(formData.get("plan") ?? "")) ?? "growth";
  const projectId = String(formData.get("projectId") ?? "").trim();
  const redirectUrl = buildBillingRedirectUrl(projectId, `checkout=started&plan=${plan}`);

  const checkoutUrl = await createLemonSqueezyCheckout({
    billingPlan: plan as BillingPlan,
    email: user.email ?? "",
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    redirectUrl,
    custom: {
      user_id: user.id,
      project_id: projectId || null,
      billing_plan: plan,
    },
  });

  redirect(checkoutUrl);
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
    .select("lemonsqueezy_subscription_id")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(`Failed to load billing subscription: ${error.message}`);
  }

  if (data.lemonsqueezy_subscription_id) {
    const signedUrl = await getSignedCustomerPortalUrl(data.lemonsqueezy_subscription_id);
    if (signedUrl) {
      redirect(signedUrl);
    }
  }

  const fallbackUrl = getUnsignedCustomerPortalUrl();
  if (!fallbackUrl) {
    throw new Error("Lemon Squeezy portal is not configured. Add LEMON_SQUEEZY_STORE_SUBDOMAIN or LEMON_SQUEEZY_STORE_CUSTOM_DOMAIN.");
  }

  redirect(fallbackUrl);
}

function buildBillingRedirectUrl(projectId: string, extraQuery: string) {
  const appUrl = requireEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "");
  const query = new URLSearchParams({
    tab: "billing",
  });

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

import "server-only";

import { cookies } from "next/headers";
import {
  getEffectiveProjectLimit,
  getProjectLimitForPlan,
  parseBillingPlan,
  type BillingPlan,
  type ProjectLimit,
} from "@/modules/billing/limits";

export const BILLING_PLAN_COOKIE = "rlr_billing_plan";

export async function getCurrentBillingPlan(): Promise<ProjectLimit> {
  const cookieStore = await cookies();
  const plan = parseBillingPlan(cookieStore.get(BILLING_PLAN_COOKIE)?.value);

  return plan ? getProjectLimitForPlan(plan) : getEffectiveProjectLimit();
}

export async function setCurrentBillingPlan(plan: BillingPlan) {
  const cookieStore = await cookies();

  cookieStore.set(BILLING_PLAN_COOKIE, plan, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

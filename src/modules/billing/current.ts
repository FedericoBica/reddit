import "server-only";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getEffectiveProjectLimit,
  getProjectLimitForPlan,
  parseBillingPlan,
  type BillingPlan,
  type ProjectLimit,
} from "@/modules/billing/limits";

export const BILLING_PLAN_COOKIE = "rlr_billing_plan";
const AI_REPLY_USAGE_OPERATIONS = [
  "lead_reply_generation",
  "mention_reply_generation",
] as const;

export type AiReplyUsage = {
  used: number;
  limit: number | null;
  remaining: number | null;
};

export async function getCurrentBillingPlan(): Promise<ProjectLimit> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("users")
        .select("billing_plan")
        .eq("id", user.id)
        .single();

      const plan = parseBillingPlan(data?.billing_plan);
      if (plan) return getProjectLimitForPlan(plan);
    }
  } catch {
    // fallback to cookie
  }

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

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("users")
        .update({ billing_plan: plan })
        .eq("id", user.id);
    }
  } catch {
    // cookie already set; DB write failure is non-fatal
  }
}

export async function getBillingPlanForUser(userId: string): Promise<ProjectLimit> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("users")
    .select("billing_plan")
    .eq("id", userId)
    .single();

  const plan = parseBillingPlan(data?.billing_plan);
  return plan ? getProjectLimitForPlan(plan) : getEffectiveProjectLimit();
}

export async function getCurrentAiReplyUsage(): Promise<AiReplyUsage> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const plan = await getCurrentBillingPlan();

  if (!user) {
    return {
      used: 0,
      limit: plan.maxAiRepliesPerMonth,
      remaining: plan.maxAiRepliesPerMonth,
    };
  }

  return getAiReplyUsageForUser(user.id, plan);
}

export async function getAiReplyUsageForUser(
  userId: string,
  plan?: ProjectLimit,
): Promise<AiReplyUsage> {
  const resolvedPlan = plan ?? await getBillingPlanForUser(userId);
  const supabase = createSupabaseAdminClient();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("api_usage_log")
    .select("requests_count")
    .eq("user_id", userId)
    .eq("service", "openai")
    .in("operation", [...AI_REPLY_USAGE_OPERATIONS])
    .gte("created_at", startOfMonth.toISOString());

  if (error) {
    throw new Error(`Failed to load AI reply usage: ${error.message}`);
  }

  const used = (data ?? []).reduce((sum, row) => sum + (row.requests_count ?? 1), 0);
  const limit = resolvedPlan.maxAiRepliesPerMonth;

  return {
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
  };
}

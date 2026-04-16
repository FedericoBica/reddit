import "server-only";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/server";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2_000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

export async function savePushSubscription(input: PushSubscriptionInput, userAgent?: string | null) {
  const user = await requireUser("/dashboard");
  const parsed = pushSubscriptionSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.endpoint,
      p256dh: parsed.keys.p256dh,
      auth: parsed.keys.auth,
      user_agent: userAgent ?? null,
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    throw new Error(`Failed to save push subscription: ${error.message}`);
  }
}

export async function deletePushSubscription(endpoint: string) {
  const user = await requireUser("/dashboard");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", z.string().url().parse(endpoint));

  if (error) {
    throw new Error(`Failed to delete push subscription: ${error.message}`);
  }
}

export async function deletePushSubscriptionByEndpoint(endpoint: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    throw new Error(`Failed to delete expired push subscription: ${error.message}`);
  }
}

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { projectIdSchema } from "@/db/schemas/domain";

export type PushSubscriptionDTO = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function listPushSubscriptionsForProject(
  projectId: string,
): Promise<PushSubscriptionDTO[]> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = createSupabaseAdminClient();

  const { data: members, error: membersError } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", parsedProjectId);

  if (membersError) {
    throw new Error(`Failed to list project members for push: ${membersError.message}`);
  }

  const userIds = [...new Set((members ?? []).map((member) => member.user_id))];

  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (error) {
    throw new Error(`Failed to list push subscriptions: ${error.message}`);
  }

  return data ?? [];
}

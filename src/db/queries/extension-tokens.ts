import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ExtensionTokenDTO } from "@/db/schemas/domain";

export async function listActiveExtensionTokens(
  userId: string,
  projectId: string,
): Promise<ExtensionTokenDTO[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("extension_tokens")
    .select("id, user_id, project_id, label, last_used_at, expires_at, revoked_at, created_at")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list extension tokens: ${error.message}`);
  }

  return data;
}

"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function markItemRead(
  itemId: string,
  itemType: "lead" | "mention",
  projectId: string,
): Promise<void> {
  if (!itemId || !projectId) return;
  const supabase = await createSupabaseServerClient();
  const table = itemType === "lead" ? "leads" : "brand_mentions";
  await supabase
    .from(table)
    .update({ opened_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("project_id", projectId)
    .is("opened_at", null);
}

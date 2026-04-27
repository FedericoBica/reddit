"use server";

import { revalidatePath } from "next/cache";
import { deleteCampaign } from "@/db/mutations/outbound";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function deleteCampaignAction(formData: FormData): Promise<void> {
  const campaignId = formData.get("campaignId") as string;
  const projectId = formData.get("projectId") as string;

  if (!campaignId || !projectId) throw new Error("Missing required fields");

  // Verify ownership via the user's session (RLS on projects).
  const supabase = await createSupabaseServerClient();
  const { data: campaign } = await supabase
    .from("dm_campaigns")
    .select("id, status")
    .eq("id", campaignId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "active") throw new Error("Pause the campaign before deleting it");

  await deleteCampaign(campaignId, projectId);
  revalidatePath("/outbound/crm");
}

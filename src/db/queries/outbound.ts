import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DmCampaignDTO, DmContactDTO, DmMessageDTO } from "@/db/schemas/domain";

export async function listCampaigns(projectId: string): Promise<DmCampaignDTO[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dm_campaigns")
    .select(campaignColumns)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list campaigns: ${error.message}`);
  return data ?? [];
}

export async function getCampaign(
  id: string,
  projectId: string,
): Promise<DmCampaignDTO | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dm_campaigns")
    .select(campaignColumns)
    .eq("id", id)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get campaign: ${error.message}`);
  return data;
}

export async function listContacts(
  projectId: string,
  filters: { status?: string; campaignId?: string } = {},
): Promise<DmContactDTO[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("dm_contacts")
    .select(contactColumns)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.status) {
    query = query.eq("status", filters.status as "queued" | "sent" | "replied" | "interested" | "won" | "lost");
  }
  if (filters.campaignId) {
    query = query.eq("last_campaign_id", filters.campaignId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list contacts: ${error.message}`);
  return data ?? [];
}

export async function listContactMessages(contactId: string): Promise<DmMessageDTO[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dm_messages")
    .select("id, project_id, campaign_id, contact_id, queue_item_id, direction, body, reddit_message_id, sent_at, received_at, created_at")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to list messages: ${error.message}`);
  return data ?? [];
}

const campaignColumns = `
  id, project_id, created_by, name, type, status,
  source_url, source_config, message_template,
  daily_limit, delay_min_sec, delay_max_sec,
  sent_count, reply_count, failed_count,
  started_at, completed_at, created_at, updated_at
` as const;

const contactColumns = `
  id, project_id, lead_id, reddit_username, source_type,
  first_campaign_id, last_campaign_id, status,
  last_message_at, last_reply_at, created_at, updated_at
` as const;

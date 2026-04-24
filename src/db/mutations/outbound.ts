import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/db/schemas/database.types";
import type {
  DmCampaignDTO,
  DmQueueItemDTO,
  DmContactDTO,
  CreateDmCampaignInput,
} from "@/db/schemas/domain";

// ─── Campaigns ────────────────────────────────────────────────

export async function createCampaign(
  input: CreateDmCampaignInput & { createdBy: string },
): Promise<DmCampaignDTO> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("dm_campaigns")
    .insert({
      project_id: input.projectId,
      created_by: input.createdBy,
      name: input.name,
      type: input.type,
      source_url: input.sourceUrl ?? null,
      source_config: input.sourceConfig as unknown as Json,
      message_template: input.messageTemplate,
      daily_limit: input.dailyLimit,
      delay_min_sec: input.delayMinSec,
      delay_max_sec: input.delayMaxSec,
    })
    .select(campaignColumns)
    .single();

  if (error) throw new Error(`Failed to create campaign: ${error.message}`);
  return data;
}

export async function setCampaignStatus(
  campaignId: string,
  projectId: string,
  status: "active" | "paused" | "completed" | "failed",
): Promise<DmCampaignDTO> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("dm_campaigns")
    .update({
      status,
      started_at: status === "active" ? new Date().toISOString() : undefined,
      completed_at: status === "completed" ? new Date().toISOString() : undefined,
    })
    .eq("id", campaignId)
    .eq("project_id", projectId)
    .select(campaignColumns)
    .single();

  if (error) throw new Error(`Failed to update campaign status: ${error.message}`);
  return data;
}

// ─── Contacts + Queue (lead campaign seeding) ─────────────────

type SeedLeadCampaignInput = {
  campaignId: string;
  projectId: string;
  minIntentScore: number;
  maxLeads: number;
  onlyNew: boolean;
};

export async function seedLeadCampaignQueue(
  input: SeedLeadCampaignInput,
): Promise<{ contactsCreated: number; queueItemsCreated: number }> {
  const supabase = createSupabaseAdminClient();

  const statusFilter = input.onlyNew
    ? (["new"] as const)
    : (["new", "reviewing"] as const);

  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("id, author, intent_score")
    .eq("project_id", input.projectId)
    .in("status", statusFilter)
    .gte("intent_score", input.minIntentScore)
    .not("author", "is", null)
    .order("intent_score", { ascending: false })
    .limit(input.maxLeads);

  if (leadsError) throw new Error(`Failed to fetch leads: ${leadsError.message}`);
  if (!leads || leads.length === 0) return { contactsCreated: 0, queueItemsCreated: 0 };

  // Find existing contacts for this project to enforce no-recontact rule.
  const usernames = leads.map((l) => l.author as string);
  const { data: existing } = await supabase
    .from("dm_contacts")
    .select("reddit_username, status")
    .eq("project_id", input.projectId)
    .in("reddit_username", usernames);

  const alreadyContacted = new Set(
    (existing ?? [])
      .filter((c) => c.status !== "queued")
      .map((c) => c.reddit_username),
  );
  const alreadyQueued = new Set(
    (existing ?? [])
      .filter((c) => c.status === "queued")
      .map((c) => c.reddit_username),
  );

  // Only process leads whose author hasn't been contacted or queued yet.
  const newLeads = leads.filter(
    (l) => !alreadyContacted.has(l.author as string) && !alreadyQueued.has(l.author as string),
  );

  if (newLeads.length === 0) return { contactsCreated: 0, queueItemsCreated: 0 };

  // Upsert contacts.
  const { error: contactsError } = await supabase.from("dm_contacts").upsert(
    newLeads.map((l) => ({
      project_id: input.projectId,
      lead_id: l.id,
      reddit_username: l.author as string,
      source_type: "lead" as const,
      first_campaign_id: input.campaignId,
      last_campaign_id: input.campaignId,
      status: "queued" as const,
    })),
    { onConflict: "project_id,reddit_username", ignoreDuplicates: true },
  );

  if (contactsError) throw new Error(`Failed to upsert contacts: ${contactsError.message}`);

  // Fetch freshly inserted contact IDs.
  const { data: contacts, error: fetchError } = await supabase
    .from("dm_contacts")
    .select("id, reddit_username")
    .eq("project_id", input.projectId)
    .in("reddit_username", newLeads.map((l) => l.author as string));

  if (fetchError) throw new Error(`Failed to fetch contacts: ${fetchError.message}`);

  // Insert queue items — ON CONFLICT DO NOTHING via ignoreDuplicates.
  const { error: queueError } = await supabase.from("dm_queue").upsert(
    (contacts ?? []).map((c) => ({
      campaign_id: input.campaignId,
      contact_id: c.id,
      priority: 0,
      status: "pending" as const,
      scheduled_at: new Date().toISOString(),
    })),
    { onConflict: "campaign_id,contact_id", ignoreDuplicates: true },
  );

  if (queueError) throw new Error(`Failed to create queue items: ${queueError.message}`);

  return {
    contactsCreated: contacts?.length ?? 0,
    queueItemsCreated: contacts?.length ?? 0,
  };
}

// ─── Queue execution ──────────────────────────────────────────

export async function getNextQueueItem(
  campaignId: string,
  projectId: string,
): Promise<(DmQueueItemDTO & { contact: DmContactDTO; interpolatedMessage: string }) | null> {
  const supabase = createSupabaseAdminClient();

  // Validate campaign belongs to the calling project and is active.
  const { data: campaign } = await supabase
    .from("dm_campaigns")
    .select("daily_limit, message_template, delay_min_sec, delay_max_sec")
    .eq("id", campaignId)
    .eq("project_id", projectId)
    .eq("status", "active")
    .single();

  if (!campaign) return null;

  // Check daily limit.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count: todaySent } = await supabase
    .from("dm_messages")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("direction", "out")
    .gte("sent_at", startOfDay.toISOString());

  if ((todaySent ?? 0) >= campaign.daily_limit) return null;

  // Find the oldest eligible pending item.
  const { data: candidate, error: selectError } = await supabase
    .from("dm_queue")
    .select(`
      id, campaign_id, contact_id, priority, status,
      error_reason, scheduled_at, sent_at, created_at, updated_at,
      dm_contacts (
        id, project_id, lead_id, reddit_username, source_type,
        first_campaign_id, last_campaign_id, status,
        last_message_at, last_reply_at, created_at, updated_at
      )
    `)
    .eq("campaign_id", campaignId)
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("priority", { ascending: false })
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (selectError) throw new Error(`Failed to get next queue item: ${selectError.message}`);
  if (!candidate || !candidate.dm_contacts) return null;

  // Atomically claim it: transition pending → sending.
  // If a concurrent runner already claimed it, this UPDATE returns no rows → return null.
  const { data: claimed, error: claimError } = await supabase
    .from("dm_queue")
    .update({ status: "sending" })
    .eq("id", candidate.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (claimError) throw new Error(`Failed to claim queue item: ${claimError.message}`);
  if (!claimed) return null; // race — another runner claimed it first

  const contact = candidate.dm_contacts as unknown as DmContactDTO;

  const interpolatedMessage = campaign.message_template
    .replace(/\{\{username\}\}/gi, contact.reddit_username)
    .replace(/\{\{subreddit\}\}/gi, "");

  const { dm_contacts: _, ...queueItem } = candidate;

  return {
    ...(queueItem as DmQueueItemDTO),
    contact,
    interpolatedMessage,
  };
}

// ─── Queue result (idempotent CAS) ────────────────────────────

type QueueResultInput = {
  queueItemId: string;
  campaignId: string;
  projectId: string;
  success: boolean;
  errorReason?: string;
};

export async function recordQueueResult(input: QueueResultInput): Promise<boolean> {
  const supabase = createSupabaseAdminClient();

  // Verify the campaign belongs to the calling project before touching any state.
  const { data: campaign } = await supabase
    .from("dm_campaigns")
    .select("id")
    .eq("id", input.campaignId)
    .eq("project_id", input.projectId)
    .maybeSingle();

  if (!campaign) throw new Error("Campaign not found or access denied");

  const now = new Date().toISOString();
  const newStatus = input.success ? "sent" : "failed";

  // CAS: only transition from pending/sending. Returns null if already transitioned.
  const { data: updated, error } = await supabase
    .from("dm_queue")
    .update({
      status: newStatus,
      sent_at: input.success ? now : null,
      error_reason: input.errorReason ?? null,
    })
    .eq("id", input.queueItemId)
    .eq("campaign_id", input.campaignId)
    .in("status", ["pending", "sending"])
    .select("id, contact_id, campaign_id")
    .maybeSingle();

  if (error) throw new Error(`Failed to record queue result: ${error.message}`);

  // Already transitioned — idempotent, return true to signal "already done".
  if (!updated) return false;

  if (input.success) {
    // Get contact's project_id and lead_id for context.
    const { data: contact } = await supabase
      .from("dm_contacts")
      .select("project_id, lead_id, reddit_username")
      .eq("id", updated.contact_id)
      .single();

    if (!contact) return true;

    // Insert outbound message row (unique constraint prevents duplicate on retry).
    await supabase.from("dm_messages").upsert(
      {
        project_id: contact.project_id,
        campaign_id: updated.campaign_id,
        contact_id: updated.contact_id,
        queue_item_id: updated.id,
        direction: "out" as const,
        body: "",
        sent_at: now,
      },
      { onConflict: "queue_item_id", ignoreDuplicates: true },
    );

    // Update contact status + timestamp.
    await supabase
      .from("dm_contacts")
      .update({ status: "sent", last_message_at: now, last_campaign_id: updated.campaign_id })
      .eq("id", updated.contact_id)
      .eq("status", "queued");

    // Increment campaign sent_count (best-effort, not transactional).
    await supabase.rpc("increment_campaign_sent_count", { _campaign_id: updated.campaign_id });

    // Increment user dm_monthly_used within same operation context.
    if (contact.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("id", contact.project_id)
        .single();

      if (project) {
        await supabase.rpc("increment_user_dm_monthly_used", { _user_id: project.owner_id });
      }
    }
  }

  return true;
}

const campaignColumns = `
  id, project_id, created_by, name, type, status,
  source_url, source_config, message_template,
  daily_limit, delay_min_sec, delay_max_sec,
  sent_count, reply_count, failed_count,
  started_at, completed_at, created_at, updated_at
` as const;

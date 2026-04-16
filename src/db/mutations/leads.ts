import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createLeadSchema,
  updateLeadStatusSchema,
  type CreateLeadInput,
  type LeadDTO,
  type UpdateLeadStatusInput,
} from "@/db/schemas/domain";

export async function createLead(input: CreateLeadInput): Promise<LeadDTO> {
  const parsed = createLeadSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      project_id: parsed.projectId,
      reddit_post_id: parsed.redditPostId,
      reddit_fullname: parsed.redditFullname ?? null,
      title: parsed.title,
      body: parsed.body ?? null,
      subreddit: parsed.subreddit,
      author: parsed.author ?? null,
      permalink: parsed.permalink,
      url: parsed.url ?? null,
      created_utc: parsed.createdUtc ?? null,
      score: parsed.score ?? null,
      num_comments: parsed.numComments ?? null,
      intent_score: parsed.intentScore ?? null,
      region_score: parsed.regionScore ?? null,
      sentiment: parsed.sentiment ?? null,
      classification_reason: parsed.classificationReason ?? null,
      classifier_prompt_version: parsed.classifierPromptVersion ?? null,
      keywords_matched: parsed.keywordsMatched,
      raw_data: parsed.rawData,
    })
    .select(leadDTOColumns)
    .single();

  if (error) {
    throw new Error(`Failed to create lead: ${error.message}`);
  }

  return data;
}

export async function createLeadForProjectWorker(
  input: CreateLeadInput,
): Promise<{ lead: LeadDTO | null; duplicate: boolean }> {
  const parsed = createLeadSchema.parse(input);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      project_id: parsed.projectId,
      reddit_post_id: parsed.redditPostId,
      reddit_fullname: parsed.redditFullname ?? null,
      title: parsed.title,
      body: parsed.body ?? null,
      subreddit: parsed.subreddit,
      author: parsed.author ?? null,
      permalink: parsed.permalink,
      url: parsed.url ?? null,
      created_utc: parsed.createdUtc ?? null,
      score: parsed.score ?? null,
      num_comments: parsed.numComments ?? null,
      intent_score: parsed.intentScore ?? null,
      region_score: parsed.regionScore ?? null,
      sentiment: parsed.sentiment ?? null,
      classification_reason: parsed.classificationReason ?? null,
      classifier_prompt_version: parsed.classifierPromptVersion ?? null,
      keywords_matched: parsed.keywordsMatched,
      raw_data: parsed.rawData,
    })
    .select(leadDTOColumns)
    .single();

  if (error?.code === "23505") {
    return { lead: null, duplicate: true };
  }

  if (error) {
    throw new Error(`Failed to create lead from worker: ${error.message}`);
  }

  return { lead: data, duplicate: false };
}

export async function markLeadOpened(projectId: string, leadId: string): Promise<LeadDTO | null> {
  const parsed = updateLeadStatusSchema
    .pick({ projectId: true, leadId: true })
    .parse({ projectId, leadId });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .update({
      status: "reviewing",
      opened_at: new Date().toISOString(),
    })
    .eq("project_id", parsed.projectId)
    .eq("id", parsed.leadId)
    .eq("status", "new")
    .select(leadDTOColumns)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to mark lead opened: ${error.message}`);
  }

  return data;
}

export async function snoozeLead(
  projectId: string,
  leadId: string,
  snoozedUntil: string,
): Promise<LeadDTO> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .update({ snoozed_until: snoozedUntil })
    .eq("project_id", projectId)
    .eq("id", leadId)
    .select(leadDTOColumns)
    .single();

  if (error) {
    throw new Error(`Failed to snooze lead: ${error.message}`);
  }

  return data;
}

export async function unsnoozeLead(projectId: string, leadId: string): Promise<LeadDTO> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .update({ snoozed_until: null })
    .eq("project_id", projectId)
    .eq("id", leadId)
    .select(leadDTOColumns)
    .single();

  if (error) {
    throw new Error(`Failed to unsnooze lead: ${error.message}`);
  }

  return data;
}

export async function updateLeadStatus(input: UpdateLeadStatusInput): Promise<LeadDTO> {
  const parsed = updateLeadStatusSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("leads")
    .update({
      status: parsed.status,
      opened_at: parsed.status === "reviewing" ? now : undefined,
      replied_at: parsed.status === "replied" ? now : undefined,
      won_value: parsed.status === "won" ? parsed.wonValue ?? null : undefined,
      lost_reason: parsed.status === "lost" ? parsed.lostReason ?? null : undefined,
    })
    .eq("project_id", parsed.projectId)
    .eq("id", parsed.leadId)
    .select(leadDTOColumns)
    .single();

  if (error) {
    throw new Error(`Failed to update lead status: ${error.message}`);
  }

  return data;
}

const leadDTOColumns = `
  id,
  project_id,
  reddit_post_id,
  title,
  body,
  subreddit,
  author,
  permalink,
  url,
  created_utc,
  score,
  num_comments,
  intent_score,
  region_score,
  sentiment,
  classification_reason,
  classifier_prompt_version,
  keywords_matched,
  status,
  snoozed_until,
  opened_at,
  replied_at,
  reply_generation_status,
  reply_generation_error,
  reply_generation_requested_at,
  reply_generation_completed_at,
  won_value,
  lost_reason,
  created_at,
  updated_at
`;

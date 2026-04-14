import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listLeadsInputSchema,
  projectIdSchema,
  leadIdSchema,
  type LeadDTO,
  type ListLeadsInput,
} from "@/db/schemas/domain";

const leadColumns = `
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

export async function listProjectLeads(input: ListLeadsInput): Promise<LeadDTO[]> {
  const parsed = listLeadsInputSchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const offset = parsed.offset ?? parsed.page * parsed.limit;

  let query = supabase
    .from("leads")
    .select(leadColumns)
    .eq("project_id", parsed.projectId)
    .order("intent_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + parsed.limit - 1);

  if (parsed.status) {
    query = query.eq("status", parsed.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list leads: ${error.message}`);
  }

  return data;
}

export async function getLeadById(projectId: string, leadId: string): Promise<LeadDTO | null> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const parsedLeadId = leadIdSchema.parse(leadId);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .select(leadColumns)
    .eq("project_id", parsedProjectId)
    .eq("id", parsedLeadId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load lead: ${error.message}`);
  }

  return data;
}

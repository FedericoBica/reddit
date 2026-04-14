import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { leadIdSchema, projectIdSchema, type LeadReplyDTO } from "@/db/schemas/domain";

export const leadReplyColumns = `
  id,
  lead_id,
  project_id,
  created_by,
  style,
  content,
  prompt_version,
  model,
  input_tokens,
  output_tokens,
  cost_usd,
  was_used,
  used_at,
  created_at
`;

export async function listLeadReplies(projectId: string, leadId: string): Promise<LeadReplyDTO[]> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const parsedLeadId = leadIdSchema.parse(leadId);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("lead_replies")
    .select(leadReplyColumns)
    .eq("project_id", parsedProjectId)
    .eq("lead_id", parsedLeadId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list lead replies: ${error.message}`);
  }

  return data;
}

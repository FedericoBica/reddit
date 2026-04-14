import "server-only";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  leadIdSchema,
  projectIdSchema,
  replyStyleSchema,
  type LeadReplyDTO,
  type ReplyStyle,
} from "@/db/schemas/domain";
import { leadReplyColumns } from "@/db/queries/lead-replies";

type RequestLeadReplyGenerationInput = {
  projectId: string;
  leadId: string;
};

export async function requestLeadReplyGeneration(input: RequestLeadReplyGenerationInput) {
  const parsed = {
    projectId: projectIdSchema.parse(input.projectId),
    leadId: leadIdSchema.parse(input.leadId),
  };
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .update({
      reply_generation_status: "generating",
      reply_generation_error: null,
      reply_generation_requested_at: new Date().toISOString(),
      reply_generation_completed_at: null,
    })
    .eq("project_id", parsed.projectId)
    .eq("id", parsed.leadId)
    .in("reply_generation_status", ["idle", "failed"])
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to request lead reply generation: ${error.message}`);
  }

  return Boolean(data);
}

type GeneratedLeadReplyInput = {
  style: ReplyStyle;
  content: string;
  promptVersion: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

type CompleteLeadReplyGenerationInput = {
  projectId: string;
  leadId: string;
  userId: string;
  replies: GeneratedLeadReplyInput[];
};

export async function completeLeadReplyGeneration(input: CompleteLeadReplyGenerationInput) {
  const parsed = {
    projectId: projectIdSchema.parse(input.projectId),
    leadId: leadIdSchema.parse(input.leadId),
    replies: input.replies.map((reply) => ({
      ...reply,
      style: replyStyleSchema.parse(reply.style),
      content: reply.content.trim(),
    })),
  };
  const supabase = createSupabaseAdminClient();

  if (parsed.replies.length !== 3) {
    throw new Error(`Expected 3 generated lead replies, received ${parsed.replies.length}`);
  }

  const { error: deleteError } = await supabase
    .from("lead_replies")
    .delete()
    .eq("project_id", parsed.projectId)
    .eq("lead_id", parsed.leadId)
    .eq("was_used", false);

  if (deleteError) {
    throw new Error(`Failed to replace generated lead replies: ${deleteError.message}`);
  }

  const { error: insertError } = await supabase.from("lead_replies").insert(
    parsed.replies.map((reply) => ({
      project_id: parsed.projectId,
      lead_id: parsed.leadId,
      created_by: input.userId,
      style: reply.style,
      content: reply.content,
      prompt_version: reply.promptVersion,
      model: reply.model,
      input_tokens: reply.inputTokens,
      output_tokens: reply.outputTokens,
      was_used: false,
    })),
  );

  if (insertError) {
    throw new Error(`Failed to insert generated lead replies: ${insertError.message}`);
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      reply_generation_status: "ready",
      reply_generation_error: null,
      reply_generation_completed_at: new Date().toISOString(),
    })
    .eq("project_id", parsed.projectId)
    .eq("id", parsed.leadId);

  if (updateError) {
    throw new Error(`Failed to mark lead replies ready: ${updateError.message}`);
  }
}

export async function failLeadReplyGeneration(projectId: string, leadId: string, message: string) {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const parsedLeadId = leadIdSchema.parse(leadId);
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("leads")
    .update({
      reply_generation_status: "failed",
      reply_generation_error: message.slice(0, 2_000),
      reply_generation_completed_at: new Date().toISOString(),
    })
    .eq("project_id", parsedProjectId)
    .eq("id", parsedLeadId);

  if (error) {
    throw new Error(`Failed to mark lead reply generation failed: ${error.message}`);
  }
}

type MarkLeadReplyUsedInput = {
  projectId: string;
  leadId: string;
  replyId: string;
};

export async function markLeadReplyUsed(input: MarkLeadReplyUsedInput): Promise<LeadReplyDTO> {
  const parsed = {
    projectId: projectIdSchema.parse(input.projectId),
    leadId: leadIdSchema.parse(input.leadId),
    replyId: z.string().uuid().parse(input.replyId),
  };
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();

  const { error: resetError } = await supabase
    .from("lead_replies")
    .update({
      was_used: false,
      used_at: null,
    })
    .eq("project_id", parsed.projectId)
    .eq("lead_id", parsed.leadId);

  if (resetError) {
    throw new Error(`Failed to reset used lead replies: ${resetError.message}`);
  }

  const { data, error: replyError } = await supabase
    .from("lead_replies")
    .update({
      was_used: true,
      used_at: now,
    })
    .eq("project_id", parsed.projectId)
    .eq("lead_id", parsed.leadId)
    .eq("id", parsed.replyId)
    .select(leadReplyColumns)
    .single();

  if (replyError) {
    throw new Error(`Failed to mark lead reply used: ${replyError.message}`);
  }

  const { error: leadError } = await supabase
    .from("leads")
    .update({
      status: "replied",
      replied_at: now,
    })
    .eq("project_id", parsed.projectId)
    .eq("id", parsed.leadId);

  if (leadError) {
    throw new Error(`Failed to mark lead replied: ${leadError.message}`);
  }

  return data;
}

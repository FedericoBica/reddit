import "server-only";

import type { Json } from "@/db/schemas/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LogApiUsageInput = {
  projectId: string;
  userId: string;
  operation: string;
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  metadata?: Json;
};

export async function logOpenAIUsage(input: LogApiUsageInput) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("api_usage_log").insert({
    project_id: input.projectId,
    user_id: input.userId,
    service: "openai",
    operation: input.operation,
    model: input.model ?? null,
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`Failed to log OpenAI usage: ${error.message}`);
  }
}

type LogRedditUsageInput = {
  projectId: string;
  operation: string;
  requestsCount: number;
  metadata?: Json;
};

type LogOpenAIUsageForProjectInput = {
  projectId: string;
  operation: string;
  model?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  requestsCount?: number;
  metadata?: Json;
};

export async function logRedditUsageForProject(input: LogRedditUsageInput) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("api_usage_log").insert({
    project_id: input.projectId,
    service: "reddit",
    operation: input.operation,
    requests_count: input.requestsCount,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`Failed to log Reddit usage: ${error.message}`);
  }
}

export async function logOpenAIUsageForProject(input: LogOpenAIUsageForProjectInput) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("api_usage_log").insert({
    project_id: input.projectId,
    service: "openai",
    operation: input.operation,
    model: input.model ?? null,
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
    requests_count: input.requestsCount ?? 1,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`Failed to log OpenAI usage: ${error.message}`);
  }
}

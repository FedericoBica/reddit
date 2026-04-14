import "server-only";

import type { Json } from "@/db/schemas/database.types";
import type { ProjectScrapeRunDTO } from "@/db/schemas/domain";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const INITIAL_SCRAPE_BACKOFF_MINUTES = 5;
const MAX_SCRAPE_BACKOFF_MINUTES = 60;

const scrapeRunColumns = `
  id,
  project_id,
  run_id,
  status,
  started_at,
  completed_at,
  subreddits_count,
  posts_seen,
  leads_created,
  duplicates_skipped,
  error_message,
  metadata,
  created_at
`;

export async function createProjectScrapeRun(input: {
  projectId: string;
  runId: string;
  subredditsCount: number;
  metadata?: Json;
}): Promise<ProjectScrapeRunDTO> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("project_scrape_runs")
    .insert({
      project_id: input.projectId,
      run_id: input.runId,
      status: "started",
      subreddits_count: input.subredditsCount,
      metadata: input.metadata ?? {},
    })
    .select(scrapeRunColumns)
    .single();

  if (error) {
    throw new Error(`Failed to create scrape run: ${error.message}`);
  }

  return data;
}

export async function completeProjectScrapeRun(input: {
  projectId: string;
  scrapeRunId: string;
  postsSeen: number;
  leadsCreated: number;
  duplicatesSkipped: number;
}): Promise<ProjectScrapeRunDTO> {
  const supabase = createSupabaseAdminClient();
  const completedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("project_scrape_runs")
    .update({
      status: "completed",
      completed_at: completedAt,
      posts_seen: input.postsSeen,
      leads_created: input.leadsCreated,
      duplicates_skipped: input.duplicatesSkipped,
    })
    .eq("id", input.scrapeRunId)
    .eq("project_id", input.projectId)
    .select(scrapeRunColumns)
    .single();

  if (error) {
    throw new Error(`Failed to complete scrape run: ${error.message}`);
  }

  await supabase
    .from("projects")
    .update({
      last_scraped_at: completedAt,
      scrape_fail_count: 0,
      scrape_backoff_until: null,
      last_scrape_error: null,
    })
    .eq("id", input.projectId);

  return data;
}

export async function failProjectScrapeRun(input: {
  projectId: string;
  scrapeRunId: string;
  currentFailCount: number;
  errorMessage: string;
}): Promise<ProjectScrapeRunDTO> {
  const supabase = createSupabaseAdminClient();
  const completedAt = new Date().toISOString();
  const nextFailCount = input.currentFailCount + 1;
  const backoffMinutes = Math.min(
    MAX_SCRAPE_BACKOFF_MINUTES,
    INITIAL_SCRAPE_BACKOFF_MINUTES * 2 ** Math.max(0, nextFailCount - 1),
  );
  const backoffUntil = new Date(Date.now() + backoffMinutes * 60 * 1_000).toISOString();

  const { data, error } = await supabase
    .from("project_scrape_runs")
    .update({
      status: "failed",
      completed_at: completedAt,
      error_message: input.errorMessage,
    })
    .eq("id", input.scrapeRunId)
    .eq("project_id", input.projectId)
    .select(scrapeRunColumns)
    .single();

  if (error) {
    throw new Error(`Failed to fail scrape run: ${error.message}`);
  }

  await supabase
    .from("projects")
    .update({
      scrape_fail_count: nextFailCount,
      scrape_backoff_until: backoffUntil,
      last_scrape_error: input.errorMessage,
    })
    .eq("id", input.projectId);

  return data;
}

export async function skipProjectScrapeRun(input: {
  projectId: string;
  scrapeRunId: string;
  reason: string;
}): Promise<ProjectScrapeRunDTO> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("project_scrape_runs")
    .update({
      status: "skipped",
      completed_at: new Date().toISOString(),
      error_message: input.reason,
    })
    .eq("id", input.scrapeRunId)
    .eq("project_id", input.projectId)
    .select(scrapeRunColumns)
    .single();

  if (error) {
    throw new Error(`Failed to skip scrape run: ${error.message}`);
  }

  return data;
}

export async function markSubredditScanned(subredditId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("subreddits")
    .update({ last_scanned_at: new Date().toISOString() })
    .eq("id", subredditId);

  if (error) {
    throw new Error(`Failed to mark subreddit scanned: ${error.message}`);
  }
}

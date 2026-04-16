import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { projectIdSchema, type KeywordDTO, type SubredditDTO } from "@/db/schemas/domain";
import type { ProjectScrapeRunDTO } from "@/db/schemas/domain";

const keywordColumns = `id, project_id, term, type, intent_category, is_active, created_at, updated_at`;
const subredditColumns = `id, project_id, name, type, is_active, is_regional, last_scanned_at, avg_daily_posts, created_at, updated_at`;
const scrapeRunColumns = `id, project_id, run_id, status, started_at, completed_at, subreddits_count, posts_seen, leads_created, duplicates_skipped, error_message, metadata, created_at`;

export async function listProjectKeywords(projectId: string): Promise<KeywordDTO[]> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("keywords")
    .select(keywordColumns)
    .eq("project_id", parsedProjectId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list keywords: ${error.message}`);
  }

  return data;
}

export async function listProjectSubreddits(projectId: string): Promise<SubredditDTO[]> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("subreddits")
    .select(subredditColumns)
    .eq("project_id", parsedProjectId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list subreddits: ${error.message}`);
  }

  return data;
}

export async function listRecentScrapeRuns(
  projectId: string,
  limit = 10,
): Promise<ProjectScrapeRunDTO[]> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("project_scrape_runs")
    .select(scrapeRunColumns)
    .eq("project_id", parsedProjectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list scrape runs: ${error.message}`);
  }

  return data;
}

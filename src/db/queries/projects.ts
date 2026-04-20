import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ProjectDTO,
  ProjectKeywordSuggestionDTO,
  ProjectSubredditSuggestionDTO,
} from "@/db/schemas/domain";

const projectColumns = `
  id,
  name,
  website_url,
  value_proposition,
  tone,
  region,
  currency_code,
  primary_language,
  secondary_language,
  status,
  onboarding_status,
  onboarding_completed_at,
  suggestions_error,
  last_scraped_at,
  last_searchbox_at,
  scrape_fail_count,
  scrape_backoff_until,
  last_scrape_error,
  created_at,
  updated_at
`;

const keywordSuggestionColumns = `
  id,
  project_id,
  term,
  intent_category,
  rationale,
  created_at
`;

const subredditSuggestionColumns = `
  id,
  project_id,
  name,
  is_regional,
  rationale,
  created_at
`;

export async function listProjectsForCurrentUser(): Promise<ProjectDTO[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("projects")
    .select(projectColumns)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list projects: ${error.message}`);
  }

  return data;
}

export async function getProjectById(projectId: string): Promise<ProjectDTO | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("projects")
    .select(projectColumns)
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load project: ${error.message}`);
  }

  return data;
}

export async function listProjectKeywordSuggestions(
  projectId: string,
): Promise<ProjectKeywordSuggestionDTO[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_keyword_suggestions")
    .select(keywordSuggestionColumns)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list keyword suggestions: ${error.message}`);
  }

  return data;
}

export async function listProjectSubredditSuggestions(
  projectId: string,
): Promise<ProjectSubredditSuggestionDTO[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_subreddit_suggestions")
    .select(subredditSuggestionColumns)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list subreddit suggestions: ${error.message}`);
  }

  return data;
}

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ScrapeTarget = {
  project: {
    id: string;
    name: string;
    website_url: string | null;
    value_proposition: string | null;
    tone: string | null;
    region: string | null;
    primary_language: string;
    scrape_fail_count: number;
    last_scraped_at: string | null;
    owner_id: string;
  };
  keywords: {
    id: string;
    term: string;
    intentCategory: string | null;
  }[];
  subreddits: {
    id: string;
    name: string;
  }[];
};

export async function getProjectForScraping(projectId: string): Promise<ScrapeTarget | null> {
  const supabase = createSupabaseAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "id, name, website_url, value_proposition, tone, region, primary_language, scrape_fail_count, last_scraped_at, owner_id",
    )
    .eq("id", projectId)
    .eq("status", "active")
    .single();

  if (projectError || !project) {
    return null;
  }

  const [
    { data: subreddits, error: subredditsError },
    { data: keywords, error: keywordsError },
  ] = await Promise.all([
    supabase
      .from("subreddits")
      .select("id, project_id, name")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("keywords")
      .select("id, project_id, term, intent_category")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ]);

  if (subredditsError || keywordsError) {
    return null;
  }

  return {
    project,
    keywords: (keywords ?? []).map((k) => ({ id: k.id, term: k.term, intentCategory: k.intent_category ?? null })),
    subreddits: (subreddits ?? []).map((s) => ({ id: s.id, name: s.name })),
  };
}

export async function listProjectsDueForScraping(limit: number): Promise<ScrapeTarget[]> {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const minIntervalCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(
      "id, name, website_url, value_proposition, tone, region, primary_language, scrape_fail_count, last_scraped_at, owner_id",
    )
    .eq("status", "active")
    .eq("onboarding_status", "completed")
    .or(`scrape_backoff_until.is.null,scrape_backoff_until.lt.${now.toISOString()}`)
    .or(`last_scraped_at.is.null,last_scraped_at.lt.${minIntervalCutoff}`)
    .order("last_scraped_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (projectsError) {
    throw new Error(`Failed to list scrape targets: ${projectsError.message}`);
  }

  if (projects.length === 0) {
    return [];
  }

  const projectIds = projects.map((project) => project.id);
  const [
    { data: subreddits, error: subredditsError },
    { data: keywords, error: keywordsError },
  ] = await Promise.all([
    supabase
      .from("subreddits")
      .select("id, project_id, name")
      .in("project_id", projectIds)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("keywords")
      .select("id, project_id, term, intent_category")
      .in("project_id", projectIds)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ]);

  if (subredditsError) {
    throw new Error(`Failed to list scrape target subreddits: ${subredditsError.message}`);
  }

  if (keywordsError) {
    throw new Error(`Failed to list scrape target keywords: ${keywordsError.message}`);
  }

  return projects.map((project) => ({
    project,
    keywords: keywords
      .filter((keyword) => keyword.project_id === project.id)
      .map((keyword) => ({
        id: keyword.id,
        term: keyword.term,
        intentCategory: keyword.intent_category ?? null,
      })),
    subreddits: subreddits
      .filter((subreddit) => subreddit.project_id === project.id)
      .map((subreddit) => ({
        id: subreddit.id,
        name: subreddit.name,
      })),
  }));
}

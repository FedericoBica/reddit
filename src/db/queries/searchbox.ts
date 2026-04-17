import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SearchboxResultDTO, SearchboxResultStatus } from "@/db/schemas/domain";

export type SearchboxScrapeTarget = {
  project: {
    id: string;
    name: string;
    website_url: string | null;
    value_proposition: string | null;
    tone: string | null;
    region: string | null;
    primary_language: string;
    owner_id: string;
  };
  keywords: { id: string; term: string }[];
};

export async function listProjectsDueForSearchbox(): Promise<SearchboxScrapeTarget[]> {
  const supabase = createSupabaseAdminClient();

  // Only fetch projects that actually have active keywords to avoid queue starvation
  const { data: keywords, error: keywordsError } = await supabase
    .from("keywords")
    .select("id, project_id, term")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (keywordsError) throw new Error(`Failed to list searchbox keywords: ${keywordsError.message}`);

  const projectIdsWithKeywords = [...new Set((keywords ?? []).map((k) => k.project_id))];

  if (projectIdsWithKeywords.length === 0) return [];

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(
      "id, name, website_url, value_proposition, tone, region, primary_language, owner_id",
    )
    .eq("status", "active")
    .eq("onboarding_status", "completed")
    .in("id", projectIdsWithKeywords)
    .or("last_searchbox_at.is.null,last_searchbox_at.lt." + new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString())
    .order("last_searchbox_at", { ascending: true, nullsFirst: true });

  if (projectsError) throw new Error(`Failed to list searchbox targets: ${projectsError.message}`);
  if (projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);

  return projects.map((project) => ({
    project,
    keywords: (keywords ?? [])
      .filter((k) => projectIds.includes(k.project_id) && k.project_id === project.id)
      .map((k) => ({ id: k.id, term: k.term })),
  }));
}

const searchboxResultColumns = [
  "id", "project_id", "reddit_post_id", "google_keyword", "google_rank",
  "title", "body", "subreddit", "author", "permalink", "url",
  "reddit_score", "reddit_num_comments", "reddit_created_utc",
  "intent_score", "classification_reason", "status", "lead_id",
  "first_seen_at", "last_seen_at", "created_at",
].join(", ");

export async function listSearchboxResults(input: {
  projectId: string;
  status?: SearchboxResultStatus;
  sort?: "relevance" | "recent";
  limit?: number;
  page?: number;
}): Promise<SearchboxResultDTO[]> {
  const supabase = await createSupabaseServerClient();
  const limit = input.limit ?? 50;
  const offset = (input.page ?? 0) * limit;
  const byRecent = input.sort === "recent";

  let query = supabase
    .from("searchbox_results")
    .select(searchboxResultColumns)
    .eq("project_id", input.projectId)
    .range(offset, offset + limit - 1);

  if (input.status) query = query.eq("status", input.status);

  if (byRecent) {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query
      .order("intent_score", { ascending: false })
      .order("google_rank", { ascending: true });
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list searchbox results: ${error.message}`);
  return (data ?? []) as unknown as SearchboxResultDTO[];
}

export async function getSearchboxResult(
  projectId: string,
  resultId: string,
): Promise<SearchboxResultDTO | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("searchbox_results")
    .select(searchboxResultColumns)
    .eq("project_id", projectId)
    .eq("id", resultId)
    .maybeSingle();

  if (error) throw new Error(`Failed to get searchbox result: ${error.message}`);
  return data as unknown as SearchboxResultDTO | null;
}

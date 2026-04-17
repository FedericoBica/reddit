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

export async function listSearchboxResults(input: {
  projectId: string;
  status?: SearchboxResultStatus;
  limit?: number;
  page?: number;
}): Promise<SearchboxResultDTO[]> {
  const supabase = await createSupabaseServerClient();
  const limit = input.limit ?? 50;
  const offset = (input.page ?? 0) * limit;

  let query = supabase
    .from("searchbox_results")
    .select("*")
    .eq("project_id", input.projectId)
    .order("intent_score", { ascending: false })
    .order("google_rank", { ascending: true })
    .range(offset, offset + limit - 1);

  if (input.status) {
    query = query.eq("status", input.status);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to list searchbox results: ${error.message}`);
  return (data ?? []) as SearchboxResultDTO[];
}

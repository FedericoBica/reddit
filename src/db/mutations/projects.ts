import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createProjectSchema,
  projectIdSchema,
  saveProjectOnboardingSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type ProjectKeywordSuggestionDTO,
  type ProjectDTO,
  type ProjectSubredditSuggestionDTO,
  type SaveProjectOnboardingInput,
  type UpdateProjectInput,
} from "@/db/schemas/domain";
import type { Enums } from "@/db/schemas/database.types";

type GeneratedKeywordSuggestion = {
  term: string;
  intentCategory: Enums<"intent_category">;
  rationale: string | null;
};

type GeneratedSubredditSuggestion = {
  name: string;
  isRegional: boolean;
  rationale: string | null;
};

export async function createProject(input: CreateProjectInput): Promise<ProjectDTO> {
  const parsed = createProjectSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("create_project_with_owner", {
    _name: parsed.name,
    _website_url: parsed.websiteUrl ?? undefined,
    _value_proposition: parsed.valueProposition ?? undefined,
    _tone: parsed.tone ?? undefined,
    _region: parsed.region ?? undefined,
    _currency_code: parsed.currencyCode,
    _primary_language: parsed.primaryLanguage,
    _secondary_language: parsed.secondaryLanguage ?? undefined,
  });

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return toProjectDTO(data);
}

export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
): Promise<ProjectDTO> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const parsed = updateProjectSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("projects")
    .update({
      name: parsed.name,
      website_url: parsed.websiteUrl,
      value_proposition: parsed.valueProposition,
      tone: parsed.tone,
      region: parsed.region,
      currency_code: parsed.currencyCode,
      primary_language: parsed.primaryLanguage,
      secondary_language: parsed.secondaryLanguage,
    })
    .eq("id", parsedProjectId)
    .select(
      `
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
      `,
    )
    .single();

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  return data;
}

export async function deleteProject(projectId: string): Promise<void> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", parsedProjectId);

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

export async function setProjectOnboardingStatus(
  projectId: string,
  status: Enums<"project_onboarding_status">,
  suggestionsError?: string | null,
): Promise<ProjectDTO> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("projects")
    .update({
      onboarding_status: status,
      suggestions_error: suggestionsError ?? null,
      onboarding_completed_at: status === "completed" ? new Date().toISOString() : undefined,
    })
    .eq("id", parsedProjectId)
    .select(projectDTOColumns)
    .single();

  if (error) {
    throw new Error(`Failed to update project onboarding status: ${error.message}`);
  }

  return data;
}

export async function claimProjectSuggestionGeneration(
  projectId: string,
): Promise<ProjectDTO | null> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const supabase = await createSupabaseServerClient();
  const staleBefore = new Date(Date.now() - 2 * 60 * 1_000).toISOString();

  const { data: freshClaim, error: freshClaimError } = await supabase
    .from("projects")
    .update({
      onboarding_status: "suggestions_pending",
      suggestions_error: null,
    })
    .eq("id", parsedProjectId)
    .in("onboarding_status", ["needs_suggestions", "suggestions_failed"])
    .select(projectDTOColumns)
    .maybeSingle();

  if (freshClaimError) {
    throw new Error(`Failed to claim project suggestion generation: ${freshClaimError.message}`);
  }

  if (freshClaim) {
    return freshClaim;
  }

  const { data: staleClaim, error: staleClaimError } = await supabase
    .from("projects")
    .update({
      onboarding_status: "suggestions_pending",
      suggestions_error: null,
    })
    .eq("id", parsedProjectId)
    .eq("onboarding_status", "suggestions_pending")
    .lt("updated_at", staleBefore)
    .select(projectDTOColumns)
    .maybeSingle();

  if (staleClaimError) {
    throw new Error(
      `Failed to claim stale project suggestion generation: ${staleClaimError.message}`,
    );
  }

  return staleClaim;
}

export async function replaceProjectSuggestions(input: {
  projectId: string;
  keywords: GeneratedKeywordSuggestion[];
  subreddits: GeneratedSubredditSuggestion[];
}) {
  const parsedProjectId = projectIdSchema.parse(input.projectId);
  const supabase = await createSupabaseServerClient();

  const [{ error: keywordDeleteError }, { error: subredditDeleteError }] = await Promise.all([
    supabase.from("project_keyword_suggestions").delete().eq("project_id", parsedProjectId),
    supabase.from("project_subreddit_suggestions").delete().eq("project_id", parsedProjectId),
  ]);

  if (keywordDeleteError) {
    throw new Error(`Failed to clear keyword suggestions: ${keywordDeleteError.message}`);
  }

  if (subredditDeleteError) {
    throw new Error(`Failed to clear subreddit suggestions: ${subredditDeleteError.message}`);
  }

  if (input.keywords.length > 0) {
    const { error } = await supabase.from("project_keyword_suggestions").insert(
      input.keywords.map((keyword) => ({
        project_id: parsedProjectId,
        term: keyword.term,
        intent_category: keyword.intentCategory,
        rationale: keyword.rationale,
      })),
    );

    if (error) {
      throw new Error(`Failed to insert keyword suggestions: ${error.message}`);
    }
  }

  if (input.subreddits.length > 0) {
    const { error } = await supabase.from("project_subreddit_suggestions").insert(
      input.subreddits.map((subreddit) => ({
        project_id: parsedProjectId,
        name: subreddit.name,
        is_regional: subreddit.isRegional,
        rationale: subreddit.rationale,
      })),
    );

    if (error) {
      throw new Error(`Failed to insert subreddit suggestions: ${error.message}`);
    }
  }
}

export async function saveProjectOnboarding(
  input: SaveProjectOnboardingInput,
): Promise<ProjectDTO> {
  const parsed = saveProjectOnboardingSchema.parse(input);
  const supabase = await createSupabaseServerClient();

  const [keywordSuggestions, subredditSuggestions] = await Promise.all([
    fetchKeywordSuggestions(parsed.projectId, parsed.acceptedKeywordSuggestionIds),
    fetchSubredditSuggestions(parsed.projectId, parsed.acceptedSubredditSuggestionIds),
  ]);

  const keywordRows = [
    ...keywordSuggestions.map((keyword) => ({
      project_id: parsed.projectId,
      term: keyword.term,
      type: "ai_suggested" as const,
      intent_category: keyword.intent_category,
      is_active: true,
    })),
    ...dedupe(parsed.customKeywords.map(normalizeKeyword)).map((term) => ({
      project_id: parsed.projectId,
      term,
      type: "custom" as const,
      intent_category: null,
      is_active: true,
    })),
  ];

  const subredditRows = [
    ...subredditSuggestions.map((subreddit) => ({
      project_id: parsed.projectId,
      name: subreddit.name,
      type: "ai_suggested" as const,
      is_regional: subreddit.is_regional,
      is_active: true,
    })),
    ...dedupe(parsed.customSubreddits.map(normalizeSubredditName)).map((name) => ({
      project_id: parsed.projectId,
      name,
      type: "custom" as const,
      is_regional: false,
      is_active: true,
    })),
  ];

  if (keywordRows.length > 0) {
    const { error } = await supabase
      .from("keywords")
      .upsert(keywordRows, { onConflict: "project_id,term", ignoreDuplicates: false });

    if (error) {
      throw new Error(`Failed to save keywords: ${error.message}`);
    }
  }

  if (subredditRows.length > 0) {
    const { error } = await supabase
      .from("subreddits")
      .upsert(subredditRows, { onConflict: "project_id,name", ignoreDuplicates: false });

    if (error) {
      throw new Error(`Failed to save subreddits: ${error.message}`);
    }
  }

  return setProjectOnboardingStatus(parsed.projectId, "completed", null);
}

function toProjectDTO(project: ProjectDTO): ProjectDTO {
  return {
    id: project.id,
    name: project.name,
    website_url: project.website_url,
    value_proposition: project.value_proposition,
    tone: project.tone,
    region: project.region,
    currency_code: project.currency_code,
    primary_language: project.primary_language,
    secondary_language: project.secondary_language,
    status: project.status,
    onboarding_status: project.onboarding_status,
    onboarding_completed_at: project.onboarding_completed_at,
    suggestions_error: project.suggestions_error,
    last_scraped_at: project.last_scraped_at,
    last_searchbox_at: project.last_searchbox_at,
    scrape_fail_count: project.scrape_fail_count,
    scrape_backoff_until: project.scrape_backoff_until,
    last_scrape_error: project.last_scrape_error,
    created_at: project.created_at,
    updated_at: project.updated_at,
  };
}

async function fetchKeywordSuggestions(
  projectId: string,
  suggestionIds: string[],
): Promise<ProjectKeywordSuggestionDTO[]> {
  if (suggestionIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_keyword_suggestions")
    .select("id, project_id, term, intent_category, rationale, created_at")
    .eq("project_id", projectId)
    .in("id", suggestionIds);

  if (error) {
    throw new Error(`Failed to load accepted keyword suggestions: ${error.message}`);
  }

  return data;
}

async function fetchSubredditSuggestions(
  projectId: string,
  suggestionIds: string[],
): Promise<ProjectSubredditSuggestionDTO[]> {
  if (suggestionIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_subreddit_suggestions")
    .select("id, project_id, name, is_regional, rationale, created_at")
    .eq("project_id", projectId)
    .in("id", suggestionIds);

  if (error) {
    throw new Error(`Failed to load accepted subreddit suggestions: ${error.message}`);
  }

  return data;
}

function normalizeKeyword(keyword: string) {
  return keyword.trim().replace(/\s+/g, " ");
}

function normalizeSubredditName(subreddit: string) {
  return subreddit.trim().replace(/^r\//i, "").replace(/^\/r\//i, "").replace(/\s+/g, "");
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.length > 0)));
}

const projectDTOColumns = `
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

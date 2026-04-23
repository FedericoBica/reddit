import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  billing_plan: string;
  is_admin: boolean;
  created_at: string;
  projects_count: number;
  leads_count: number;
};

export type AdminStats = {
  totalUsers: number;
  totalProjects: number;
  totalLeads: number;
  leadsLast7Days: number;
  leadsLast30Days: number;
  totalReplies: number;
  totalScrapeRuns: number;
};

export type AdminScrapeLog = {
  id: string;
  run_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  posts_seen: number;
  leads_created: number;
  duplicates_skipped: number;
  error_message: string | null;
  project_name: string;
  project_id: string;
  owner_email: string;
};

export type AdminAlert = {
  id: string;
  kind: "duplicate_project" | "searchbox_empty" | "missing_keywords" | "scrape_failed";
  severity: "high" | "medium";
  title: string;
  description: string;
  project_id?: string;
  owner_email?: string;
};

export type AdminOverview = {
  stats: AdminStats & {
    totalSearchboxResults: number;
    searchboxResults24h: number;
    failedScrapeRuns24h: number;
    apiSpend24hUsd: number;
  };
  alerts: AdminAlert[];
  recentProjects: AdminProjectRow[];
};

export type AdminProjectRow = {
  id: string;
  name: string;
  website_url: string | null;
  status: string;
  onboarding_status: string;
  created_at: string;
  last_searchbox_at: string | null;
  last_scraped_at: string | null;
  owner_id: string;
  owner_email: string;
  keywords_count: number;
  searchbox_results_count: number;
  leads_count: number;
  latest_scrape_status: string | null;
  latest_scrape_error: string | null;
  duplicate_count: number;
  health: "healthy" | "duplicate_candidate" | "searchbox_empty" | "missing_keywords" | "jobs_failing";
};

export type AdminProjectDetail = {
  project: AdminProjectRow & {
    value_proposition: string | null;
    tone: string | null;
    region: string | null;
    primary_language: string;
    updated_at: string;
  };
  keywords: Array<{ id: string; term: string; type: string; intent_category: string | null; is_active: boolean }>;
  recentSearchboxResults: Array<{
    id: string;
    title: string;
    subreddit: string;
    google_keyword: string;
    google_rank: number;
    status: string;
    intent_score: number | null;
    created_at: string;
  }>;
  recentScrapeRuns: AdminScrapeLog[];
  usage: {
    totalCostUsd: number;
    last24hCostUsd: number;
    operations: Array<{ operation: string; requests: number; costUsd: number }>;
  };
};

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const ago7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const ago30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: totalProjects },
    { count: totalLeads },
    { count: leadsLast7Days },
    { count: leadsLast30Days },
    { count: totalReplies },
    { count: totalScrapeRuns },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", ago7),
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", ago30),
    supabase.from("lead_replies").select("*", { count: "exact", head: true }),
    supabase.from("project_scrape_runs").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    totalProjects: totalProjects ?? 0,
    totalLeads: totalLeads ?? 0,
    leadsLast7Days: leadsLast7Days ?? 0,
    leadsLast30Days: leadsLast30Days ?? 0,
    totalReplies: totalReplies ?? 0,
    totalScrapeRuns: totalScrapeRuns ?? 0,
  };
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const supabase = createSupabaseAdminClient();

  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, full_name, billing_plan, is_admin, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list users: ${error.message}`);
  if (!users || users.length === 0) return [];

  const userIds = users.map((u) => u.id);

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, owner_id")
    .in("owner_id", userIds);

  if (projectsError) throw new Error(`Failed to list user projects: ${projectsError.message}`);

  const projectIdsByOwner = new Map<string, string[]>();
  for (const p of projects ?? []) {
    projectIdsByOwner.set(p.owner_id, [...(projectIdsByOwner.get(p.owner_id) ?? []), p.id]);
  }

  const leadCountEntries = await Promise.all(
    users.map(async (user) => {
      const projectIds = projectIdsByOwner.get(user.id) ?? [];
      if (projectIds.length === 0) return [user.id, 0] as const;

      const { count, error: leadsError } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .in("project_id", projectIds);

      if (leadsError) throw new Error(`Failed to count user leads: ${leadsError.message}`);
      return [user.id, count ?? 0] as const;
    }),
  );
  const leadsByOwner = Object.fromEntries(leadCountEntries);

  return users.map((u) => ({
    ...u,
    projects_count: projectIdsByOwner.get(u.id)?.length ?? 0,
    leads_count: leadsByOwner[u.id] ?? 0,
  }));
}

export async function listAdminScrapeLogs(limit = 100): Promise<AdminScrapeLog[]> {
  const supabase = createSupabaseAdminClient();

  const { data: runs, error } = await supabase
    .from("project_scrape_runs")
    .select("id, run_id, status, started_at, completed_at, posts_seen, leads_created, duplicates_skipped, error_message, project_id")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to list scrape logs: ${error.message}`);
  if (!runs || runs.length === 0) return [];

  const projectIds = [...new Set(runs.map((r) => r.project_id))];

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, owner_id")
    .in("id", projectIds);

  const ownerIds = [...new Set((projects ?? []).map((p) => p.owner_id))];

  const { data: users } = await supabase
    .from("users")
    .select("id, email")
    .in("id", ownerIds);

  const projectMap: Record<string, { name: string; owner_id: string }> = {};
  for (const p of projects ?? []) {
    projectMap[p.id] = { name: p.name, owner_id: p.owner_id };
  }

  const userMap: Record<string, string> = {};
  for (const u of users ?? []) {
    userMap[u.id] = u.email;
  }

  return runs.map((run) => {
    const project = projectMap[run.project_id];
    const ownerEmail = project ? (userMap[project.owner_id] ?? "—") : "—";
    return {
      ...run,
      project_name: project?.name ?? "—",
      owner_email: ownerEmail,
    };
  });
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = createSupabaseAdminClient();
  const now = Date.now();
  const ago24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [
    stats,
    { count: totalSearchboxResults },
    { count: searchboxResults24h },
    { count: failedScrapeRuns24h },
    { data: apiUsage24h },
    projects,
  ] = await Promise.all([
    getAdminStats(),
    supabase.from("searchbox_results").select("*", { count: "exact", head: true }),
    supabase.from("searchbox_results").select("*", { count: "exact", head: true }).gte("created_at", ago24h),
    supabase.from("project_scrape_runs").select("*", { count: "exact", head: true }).eq("status", "failed").gte("started_at", ago24h),
    supabase.from("api_usage_log").select("cost_usd").gte("created_at", ago24h),
    listAdminProjects(8),
  ]);

  const alerts = await listAdminAlerts(8);

  return {
    stats: {
      ...stats,
      totalSearchboxResults: totalSearchboxResults ?? 0,
      searchboxResults24h: searchboxResults24h ?? 0,
      failedScrapeRuns24h: failedScrapeRuns24h ?? 0,
      apiSpend24hUsd: sumCost(apiUsage24h),
    },
    alerts,
    recentProjects: projects,
  };
}

export async function listAdminProjects(limit = 100): Promise<AdminProjectRow[]> {
  const supabase = createSupabaseAdminClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, website_url, status, onboarding_status, created_at, updated_at, last_searchbox_at, last_scraped_at, value_proposition, tone, region, primary_language, owner_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to list admin projects: ${error.message}`);
  if (!projects || projects.length === 0) return [];

  return enrichAdminProjects(projects);
}

export async function getAdminProjectDetail(projectId: string): Promise<AdminProjectDetail | null> {
  const supabase = createSupabaseAdminClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, website_url, status, onboarding_status, created_at, updated_at, last_searchbox_at, last_scraped_at, value_proposition, tone, region, primary_language, owner_id")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load admin project: ${error.message}`);
  if (!project) return null;

  const [projectRow] = await enrichAdminProjects([project]);

  const [keywordsRes, searchboxRes, usageRes, recentScrapeRuns] = await Promise.all([
    supabase
      .from("keywords")
      .select("id, term, type, intent_category, is_active")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("searchbox_results")
      .select("id, title, subreddit, google_keyword, google_rank, status, intent_score, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("api_usage_log")
      .select("operation, requests_count, cost_usd, created_at")
      .eq("project_id_snapshot", projectId)
      .order("created_at", { ascending: false })
      .limit(200),
    listAdminScrapeLogs(50),
  ]);

  if (keywordsRes.error) throw new Error(`Failed to load project keywords: ${keywordsRes.error.message}`);
  if (searchboxRes.error) throw new Error(`Failed to load searchbox results: ${searchboxRes.error.message}`);
  if (usageRes.error) throw new Error(`Failed to load project usage: ${usageRes.error.message}`);

  const usageRows = usageRes.data ?? [];
  const ago24h = Date.now() - 24 * 60 * 60 * 1000;
  const usageByOperation = new Map<string, { requests: number; costUsd: number }>();

  for (const row of usageRows) {
    const current = usageByOperation.get(row.operation) ?? { requests: 0, costUsd: 0 };
    current.requests += row.requests_count ?? 1;
    current.costUsd += Number(row.cost_usd ?? 0);
    usageByOperation.set(row.operation, current);
  }

  return {
    project: {
      ...projectRow,
      value_proposition: project.value_proposition,
      tone: project.tone,
      region: project.region,
      primary_language: project.primary_language,
      updated_at: project.updated_at,
    },
    keywords: keywordsRes.data ?? [],
    recentSearchboxResults: searchboxRes.data ?? [],
    recentScrapeRuns: recentScrapeRuns.filter((run) => run.project_id === projectId).slice(0, 10),
    usage: {
      totalCostUsd: sumCost(usageRows),
      last24hCostUsd: sumCost(usageRows.filter((row) => new Date(row.created_at).getTime() >= ago24h)),
      operations: [...usageByOperation.entries()]
        .map(([operation, value]) => ({ operation, requests: value.requests, costUsd: value.costUsd }))
        .sort((a, b) => b.costUsd - a.costUsd),
    },
  };
}

async function listAdminAlerts(limit = 8): Promise<AdminAlert[]> {
  const [projects, scrapeLogs] = await Promise.all([
    listAdminProjects(200),
    listAdminScrapeLogs(50),
  ]);

  const alerts: AdminAlert[] = [];

  for (const project of projects) {
    if (project.duplicate_count > 1) {
      alerts.push({
        id: `dup-${project.id}`,
        kind: "duplicate_project",
        severity: "high",
        title: `Possible duplicate project: ${project.name}`,
        description: `${project.duplicate_count} projects share the same owner and website/name fingerprint.`,
        project_id: project.id,
        owner_email: project.owner_email,
      });
    }

    if (project.last_searchbox_at && project.searchbox_results_count === 0) {
      alerts.push({
        id: `sb-empty-${project.id}`,
        kind: "searchbox_empty",
        severity: "high",
        title: `Searchbox scan produced no visible results`,
        description: `${project.name} has a completed searchbox timestamp but zero stored results.`,
        project_id: project.id,
        owner_email: project.owner_email,
      });
    }

    if (project.onboarding_status === "completed" && project.keywords_count === 0) {
      alerts.push({
        id: `kw-${project.id}`,
        kind: "missing_keywords",
        severity: "medium",
        title: `Project missing active keywords`,
        description: `${project.name} is completed but has no active keywords.`,
        project_id: project.id,
        owner_email: project.owner_email,
      });
    }
  }

  for (const log of scrapeLogs.filter((log) => log.status === "failed").slice(0, 5)) {
    alerts.push({
      id: `scrape-${log.id}`,
      kind: "scrape_failed",
      severity: "medium",
      title: `Scrape failed for ${log.project_name}`,
      description: log.error_message ?? "The latest scrape run failed without an error message.",
      project_id: log.project_id,
      owner_email: log.owner_email,
    });
  }

  return alerts.slice(0, limit);
}

async function enrichAdminProjects(
  projects: Array<{
    id: string;
    name: string;
    website_url: string | null;
    status: string;
    onboarding_status: string;
    created_at: string;
    updated_at: string;
    last_searchbox_at: string | null;
    last_scraped_at: string | null;
    value_proposition: string | null;
    tone: string | null;
    region: string | null;
    primary_language: string;
    owner_id: string;
  }>,
): Promise<AdminProjectRow[]> {
  const supabase = createSupabaseAdminClient();
  const ownerIds = [...new Set(projects.map((project) => project.owner_id))];
  const projectIds = projects.map((project) => project.id);

  const [usersRes, keywordsRes, resultsRes, leadsRes, scrapeRunsRes] = await Promise.all([
    supabase.from("users").select("id, email").in("id", ownerIds),
    supabase.from("keywords").select("project_id, is_active").in("project_id", projectIds).eq("is_active", true),
    supabase.from("searchbox_results").select("project_id").in("project_id", projectIds),
    supabase.from("leads").select("project_id").in("project_id", projectIds),
    supabase
      .from("project_scrape_runs")
      .select("id, project_id, status, error_message, started_at")
      .in("project_id", projectIds)
      .order("started_at", { ascending: false }),
  ]);

  if (usersRes.error) throw new Error(`Failed to load admin owners: ${usersRes.error.message}`);
  if (keywordsRes.error) throw new Error(`Failed to load project keywords: ${keywordsRes.error.message}`);
  if (resultsRes.error) throw new Error(`Failed to load searchbox counts: ${resultsRes.error.message}`);
  if (leadsRes.error) throw new Error(`Failed to load lead counts: ${leadsRes.error.message}`);
  if (scrapeRunsRes.error) throw new Error(`Failed to load scrape runs: ${scrapeRunsRes.error.message}`);

  const emailsByUser = new Map((usersRes.data ?? []).map((user) => [user.id, user.email]));
  const keywordsByProject = countById(keywordsRes.data ?? [], "project_id");
  const resultsByProject = countById(resultsRes.data ?? [], "project_id");
  const leadsByProject = countById(leadsRes.data ?? [], "project_id");
  const latestRunByProject = new Map<string, { status: string; error_message: string | null }>();

  for (const run of scrapeRunsRes.data ?? []) {
    if (!latestRunByProject.has(run.project_id)) {
      latestRunByProject.set(run.project_id, {
        status: run.status,
        error_message: run.error_message,
      });
    }
  }

  const duplicateCounts = buildDuplicateCounts(projects);

  return projects.map((project) => {
    const keywordsCount = keywordsByProject.get(project.id) ?? 0;
    const searchboxResultsCount = resultsByProject.get(project.id) ?? 0;
    const latestScrape = latestRunByProject.get(project.id);
    const duplicateCount = duplicateCounts.get(project.id) ?? 1;

    let health: AdminProjectRow["health"] = "healthy";
    if (duplicateCount > 1) health = "duplicate_candidate";
    else if (latestScrape?.status === "failed") health = "jobs_failing";
    else if (project.last_searchbox_at && searchboxResultsCount === 0) health = "searchbox_empty";
    else if (project.onboarding_status === "completed" && keywordsCount === 0) health = "missing_keywords";

    return {
      id: project.id,
      name: project.name,
      website_url: project.website_url,
      status: project.status,
      onboarding_status: project.onboarding_status,
      created_at: project.created_at,
      last_searchbox_at: project.last_searchbox_at,
      last_scraped_at: project.last_scraped_at,
      owner_id: project.owner_id,
      owner_email: emailsByUser.get(project.owner_id) ?? "—",
      keywords_count: keywordsCount,
      searchbox_results_count: searchboxResultsCount,
      leads_count: leadsByProject.get(project.id) ?? 0,
      latest_scrape_status: latestScrape?.status ?? null,
      latest_scrape_error: latestScrape?.error_message ?? null,
      duplicate_count: duplicateCount,
      health,
    };
  });
}

function countById<T extends { [K in P]: string }, P extends keyof T>(rows: T[], key: P): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row[key], (map.get(row[key]) ?? 0) + 1);
  }
  return map;
}

function buildDuplicateCounts(
  projects: Array<{ id: string; owner_id: string; name: string; website_url: string | null }>,
): Map<string, number> {
  const groups = new Map<string, string[]>();
  for (const project of projects) {
    const fingerprint = normalizeProjectFingerprint(project.name, project.website_url);
    const key = `${project.owner_id}:${fingerprint}`;
    groups.set(key, [...(groups.get(key) ?? []), project.id]);
  }

  const counts = new Map<string, number>();
  for (const ids of groups.values()) {
    for (const id of ids) counts.set(id, ids.length);
  }
  return counts;
}

function normalizeProjectFingerprint(name: string, websiteUrl: string | null): string {
  const value = (websiteUrl ?? name).trim().toLowerCase();
  return value.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
}

function sumCost(rows: Array<{ cost_usd?: number | string | null }> | null | undefined): number {
  return Number(
    (rows ?? []).reduce((total, row) => total + Number(row.cost_usd ?? 0), 0).toFixed(4),
  );
}

// ── Schedule settings ─────────────────────────────────────────

export type ScheduleSettings = {
  opportunities_hour: number;
  mentions_hour: number;
  searchbox_hour: number;
  searchbox_days: number[];
};

const SCHEDULE_DEFAULTS: ScheduleSettings = {
  opportunities_hour: 9,
  mentions_hour: 10,
  searchbox_hour: 11,
  searchbox_days: [1, 15],
};

export async function getScheduleSettings(): Promise<ScheduleSettings> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "scrape_schedule")
    .single();

  if (!data?.value) return SCHEDULE_DEFAULTS;
  return { ...SCHEDULE_DEFAULTS, ...(data.value as Partial<ScheduleSettings>) };
}

export async function saveScheduleSettings(settings: ScheduleSettings): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("admin_settings")
    .upsert({ key: "scrape_schedule", value: settings, updated_at: new Date().toISOString() });
}

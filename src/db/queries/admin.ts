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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("admin_settings")
    .select("value")
    .eq("key", "scrape_schedule")
    .single();

  if (!data?.value) return SCHEDULE_DEFAULTS;
  return { ...SCHEDULE_DEFAULTS, ...(data.value as Partial<ScheduleSettings>) };
}

export async function saveScheduleSettings(settings: ScheduleSettings): Promise<void> {
  const supabase = createSupabaseAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("admin_settings")
    .upsert({ key: "scrape_schedule", value: settings, updated_at: new Date().toISOString() });
}

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

  const [{ data: projects }, { data: leads }] = await Promise.all([
    supabase.from("projects").select("owner_id").in("owner_id", userIds),
    supabase.from("leads").select("project_id, projects!inner(owner_id)").in("projects.owner_id", userIds),
  ]);

  const projectsByOwner: Record<string, number> = {};
  for (const p of projects ?? []) {
    projectsByOwner[p.owner_id] = (projectsByOwner[p.owner_id] ?? 0) + 1;
  }

  // count leads per user via project ownership
  const { data: projectOwners } = await supabase
    .from("projects")
    .select("id, owner_id")
    .in("owner_id", userIds);

  const projectOwnerMap: Record<string, string> = {};
  for (const p of projectOwners ?? []) {
    projectOwnerMap[p.id] = p.owner_id;
  }

  const { data: leadCounts } = await supabase
    .from("leads")
    .select("project_id")
    .in("project_id", Object.keys(projectOwnerMap));

  const leadsByOwner: Record<string, number> = {};
  for (const l of leadCounts ?? []) {
    const ownerId = projectOwnerMap[l.project_id];
    if (ownerId) {
      leadsByOwner[ownerId] = (leadsByOwner[ownerId] ?? 0) + 1;
    }
  }

  return users.map((u) => ({
    ...u,
    projects_count: projectsByOwner[u.id] ?? 0,
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

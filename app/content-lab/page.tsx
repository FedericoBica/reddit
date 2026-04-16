import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { listAllProjectLeads } from "@/db/queries/leads";
import { listProjectSubredditSuggestions } from "@/db/queries/projects";
import type { LeadDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import { PostDraftGenerator } from "./post-draft-generator";

export const metadata: Metadata = {
  title: "Content Lab",
};

type ContentLabPageProps = {
  searchParams?: Promise<{ projectId?: string }>;
};

type TrendingTopic = {
  subreddit: string;
  theme: string;
  count: number;
  leads: { title: string; permalink: string }[];
};

export type SubredditCooldown = {
  daysSince: number;
  status: "safe" | "caution" | "wait";
};

function buildSubredditCooldowns(leads: LeadDTO[]): Record<string, SubredditCooldown> {
  const latestBySubreddit = new Map<string, string>();
  for (const lead of leads) {
    if (!lead.replied_at) continue;
    const existing = latestBySubreddit.get(lead.subreddit);
    if (!existing || lead.replied_at > existing) {
      latestBySubreddit.set(lead.subreddit, lead.replied_at);
    }
  }
  const now = Date.now();
  const result: Record<string, SubredditCooldown> = {};
  for (const [subreddit, lastRepliedAt] of latestBySubreddit.entries()) {
    const daysSince = Math.floor((now - new Date(lastRepliedAt).getTime()) / 86_400_000);
    result[subreddit] = {
      daysSince,
      status: daysSince >= 7 ? "safe" : daysSince >= 4 ? "caution" : "wait",
    };
  }
  return result;
}

function computeTrendingTopics(leads: LeadDTO[]): TrendingTopic[] {
  // Group leads by subreddit, then find common keywords across titles
  const bySubreddit: Record<string, LeadDTO[]> = {};
  for (const lead of leads) {
    if (!lead.subreddit) continue;
    (bySubreddit[lead.subreddit] ??= []).push(lead);
  }

  const topics: TrendingTopic[] = [];

  for (const [subreddit, subredditLeads] of Object.entries(bySubreddit)) {
    // Count keyword occurrences across all leads in this subreddit
    const keywordCounts: Record<string, { count: number; leads: LeadDTO[] }> = {};
    for (const lead of subredditLeads) {
      const kws = lead.keywords_matched ?? [];
      for (const kw of kws) {
        const key = kw.toLowerCase().trim();
        if (!key) continue;
        if (!keywordCounts[key]) keywordCounts[key] = { count: 0, leads: [] };
        keywordCounts[key].count++;
        keywordCounts[key].leads.push(lead);
      }
    }

    // Take top 3 keywords for this subreddit
    const sorted = Object.entries(keywordCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);

    for (const [theme, { count, leads: matchedLeads }] of sorted) {
      if (count < 2) continue; // only show if at least 2 leads
      topics.push({
        subreddit,
        theme,
        count,
        leads: matchedLeads.slice(0, 3).map((l) => ({
          title: l.title,
          permalink: l.permalink ?? "",
        })),
      });
    }
  }

  // Sort by count descending
  return topics.sort((a, b) => b.count - a.count).slice(0, 12);
}

export default async function ContentLabPage({ searchParams }: ContentLabPageProps) {
  const user = await requireUser("/content-lab");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject, projects } = projectState;

  if (currentProject.onboarding_status !== "completed") {
    redirect(`/onboarding/project?projectId=${currentProject.id}`);
  }

  const [leads, subredditSuggestions] = await Promise.all([
    listAllProjectLeads(currentProject.id, 300),
    listProjectSubredditSuggestions(currentProject.id),
  ]);

  const trendingTopics = computeTrendingTopics(leads);
  const subreddits = subredditSuggestions.map((s) => s.name);
  const valueProposition = currentProject.value_proposition ?? "";
  const cooldowns = buildSubredditCooldowns(leads);

  return (
    <DashboardShell user={user} currentProject={currentProject} projects={projects}>
      <div className="app-page" style={{ minHeight: "100vh" }}>
        <header className="page-header">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <p className="page-kicker">Content Lab</p>
              <h1 className="page-title">Creá contenido que convierte</h1>
              <p className="page-copy">
                Detectá preguntas trending y generá borradores de posts nativos de Reddit en segundos.
              </p>
            </div>
            <Link
              href={`/calendar?projectId=${currentProject.id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #E5E5EA",
                background: "#fff",
                fontSize: 12,
                fontWeight: 700,
                color: "#6B6B6E",
                textDecoration: "none",
                flexShrink: 0,
                marginTop: 4,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Ver calendario
            </Link>
          </div>
        </header>

        <div className="content-flow">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr", gap: 20, alignItems: "start" }}>
          {/* Left: Trending topics */}
          <div style={{ display: "grid", gap: 14 }}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #F0F0EE",
                borderRadius: 12,
                padding: "20px 22px",
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 800, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
                Tendencias en tus subreddits
              </p>

              {trendingTopics.length === 0 ? (
                <p style={{ fontSize: 13, color: "#AEAEB2", textAlign: "center", padding: "20px 0" }}>
                  Acumulá más leads para ver tendencias.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {trendingTopics.map((topic, i) => (
                    <div
                      key={`${topic.subreddit}-${topic.theme}-${i}`}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 8,
                        border: "1px solid #F0F0EE",
                        background: "#FAFAF8",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: "#E07000",
                              background: "#FFF3E8",
                              padding: "2px 7px",
                              borderRadius: 4,
                            }}
                          >
                            r/{topic.subreddit}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>
                            {topic.theme}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#6B6B6E",
                            background: "#EAEAE8",
                            padding: "2px 8px",
                            borderRadius: 10,
                          }}
                        >
                          {topic.count} posts
                        </span>
                      </div>
                      <div style={{ display: "grid", gap: 3 }}>
                        {topic.leads.map((lead, j) => (
                          <a
                            key={j}
                            href={lead.permalink ? `https://reddit.com${lead.permalink}` : "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 11,
                              color: "#6B6B6E",
                              textDecoration: "none",
                              lineHeight: 1.4,
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            · {lead.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Post draft generator */}
          <PostDraftGenerator subreddits={subreddits} valueProposition={valueProposition} cooldowns={cooldowns} />
        </div>
        </div>
      </div>
    </DashboardShell>
  );
}

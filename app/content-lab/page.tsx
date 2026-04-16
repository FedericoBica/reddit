import type { Metadata } from "next";
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

  return (
    <DashboardShell user={user} currentProject={currentProject} projects={projects}>
      <div style={{ padding: "28px 28px 48px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
            Content Lab
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1C1C1E", margin: 0 }}>
            Create content that converts
          </h1>
          <p style={{ fontSize: 13, color: "#6B6B6E", marginTop: 6 }}>
            Spot trending questions and generate Reddit-native post drafts in seconds.
          </p>
        </div>

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
                Trending in your subreddits
              </p>

              {trendingTopics.length === 0 ? (
                <p style={{ fontSize: 13, color: "#AEAEB2", textAlign: "center", padding: "20px 0" }}>
                  Collect more leads to see trends.
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
          <PostDraftGenerator subreddits={subreddits} valueProposition={valueProposition} />
        </div>
      </div>
    </DashboardShell>
  );
}

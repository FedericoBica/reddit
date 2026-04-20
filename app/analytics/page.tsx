import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { listAllProjectLeads } from "@/db/queries/leads";
import type { LeadDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = {
  title: "Analytics",
};

type AnalyticsPageProps = {
  searchParams?: Promise<{ projectId?: string }>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const user = await requireUser("/analytics");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject, projects } = projectState;


  const allLeads = await listAllProjectLeads(currentProject.id, 500);

  const stats = computeStats(allLeads);
  const subredditStats = computeSubredditStats(allLeads);
  const keywordStats = computeKeywordStats(allLeads);
  const relevantSubreddits = computeRelevantSubreddits(allLeads);
  const timeline = computeTimeline(allLeads);

  const newLeadsCount = allLeads.filter((l) => l.status === "new").length;

  return (
    <DashboardShell
      user={user}
      projects={projects}
      currentProject={currentProject}
      newLeadsCount={newLeadsCount}
    >
      <div className="app-page" style={{ minHeight: "100vh" }}>
        {/* Header */}
        <header className="page-header">
          <div>
            <p className="page-kicker">Analytics</p>
            <h1 className="page-title">ROI del proyecto</h1>
            <p className="page-copy">
              Rendimiento de {currentProject.name}. Últimos {allLeads.length} leads
              {currentProject.last_scraped_at
                ? ` · Último scan ${formatDate(currentProject.last_scraped_at)}`
                : ""}
            </p>
          </div>
          <ProjectHealthBadge project={currentProject} />
        </header>

        <div className="content-flow">
          {/* ── KPI Row ── */}
          <div className="metric-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
            <KpiCard label="Total leads" value={stats.total} />
            <KpiCard label="Nuevos" value={stats.new} accent />
            <KpiCard label="Respondidos" value={stats.replied} />
            <KpiCard label="Score promedio" value={stats.avgScore > 0 ? stats.avgScore : "—"} />
          </div>

          {/* ── Relevant Subreddits ── */}
          <div className="panel panel-pad" style={{ marginBottom: 20 }}>
            <p className="section-title" style={{ marginBottom: 6 }}>Subreddits más relevantes</p>
            <p className="section-copy" style={{ marginBottom: 16 }}>
              Relevancy score basado en intención promedio, volumen de leads y concentración de high intent.
            </p>
            {relevantSubreddits.length > 0 ? (
              <div style={{ display: "grid", gap: 12 }}>
                {relevantSubreddits.slice(0, 8).map((row) => (
                  <RelevantSubredditBucket key={row.subreddit} {...row} />
                ))}
              </div>
            ) : (
              <p className="section-copy" style={{ marginTop: 12 }}>
                Todavía no hay leads para analizar.
              </p>
            )}
          </div>

          {/* ── Timeline ── */}
          {timeline.length > 0 && (
            <div className="panel panel-pad" style={{ marginBottom: 20 }}>
              <p className="section-title" style={{ marginBottom: 16 }}>Actividad reciente (últimos 14 días)</p>
              <TimelineChart rows={timeline} />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* ── Top Subreddits ── */}
            <div className="panel panel-pad">
              <p className="section-title" style={{ marginBottom: 16 }}>Subreddits más activos</p>
              {subredditStats.length > 0 ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {subredditStats.slice(0, 8).map((row) => (
                    <SubredditRow key={row.subreddit} {...row} maxCount={subredditStats[0].count} />
                  ))}
                </div>
              ) : (
                <p className="section-copy">Sin datos todavía.</p>
              )}
            </div>

            {/* ── Top Keywords ── */}
            <div className="panel panel-pad">
              <p className="section-title" style={{ marginBottom: 16 }}>Keywords con más matches</p>
              {keywordStats.length > 0 ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {keywordStats.slice(0, 8).map((row) => (
                    <KeywordRow key={row.keyword} {...row} maxCount={keywordStats[0].count} />
                  ))}
                </div>
              ) : (
                <p className="section-copy">Sin datos todavía.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardShell>
  );
}

// ── Sub-components ────────────────────────────────────────────

function KpiCard({
  label,
  value,
  accent = false,
  highlight = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div
        className="metric-value"
        style={{
          fontSize: 28,
          color: highlight ? "#E07000" : accent ? "#1C1C1E" : "#1C1C1E",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ProjectHealthBadge({ project }: { project: { scrape_fail_count: number; scrape_backoff_until: string | null; last_scraped_at: string | null } }) {
  const isBackedOff = project.scrape_backoff_until
    ? new Date(project.scrape_backoff_until) > new Date()
    : false;
  const isHealthy = project.scrape_fail_count === 0 && !isBackedOff;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 8,
          background: isHealthy ? "#F0FDF4" : "#FFF3E8",
          border: `1px solid ${isHealthy ? "#BBF7D0" : "rgba(224,112,0,0.2)"}`,
          fontSize: 12,
          fontWeight: 700,
          color: isHealthy ? "#15803D" : "#E07000",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: isHealthy ? "#22C55E" : "#E07000",
            flexShrink: 0,
          }}
        />
        {isHealthy ? "Scraper activo" : isBackedOff ? "En cooldown" : `${project.scrape_fail_count} errores`}
      </div>
    </div>
  );
}


function RelevantSubredditBucket({
  subreddit,
  relevancyScore,
  count,
  avgScore,
  highIntentRate,
}: {
  subreddit: string;
  relevancyScore: number;
  count: number;
  avgScore: number;
  highIntentRate: number;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 5,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>r/{subreddit}</span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 700 }}>
            avg {avgScore} · {count} leads · {highIntentRate}% high intent
          </span>
          <span style={{ fontSize: 14, fontWeight: 900, color: "#E07000", minWidth: 42, textAlign: "right" }}>
            {relevancyScore}%
          </span>
        </div>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: "#F0F0EE", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            background: "#E07000",
            width: `${relevancyScore}%`,
          }}
        />
      </div>
    </div>
  );
}

function SubredditRow({
  subreddit,
  count,
  avgScore,
  maxCount,
}: {
  subreddit: string;
  count: number;
  avgScore: number;
  maxCount: number;
}) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>r/{subreddit}</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 700 }}>
            avg {avgScore}
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#E07000", minWidth: 24, textAlign: "right" }}>
            {count}
          </span>
        </div>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: "#F0F0EE", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, background: "#E07000", width: `${pct}%`, opacity: 0.7 }} />
      </div>
    </div>
  );
}

function KeywordRow({
  keyword,
  count,
  maxCount,
}: {
  keyword: string;
  count: number;
  maxCount: number;
}) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
          {keyword}
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#1C1C1E", minWidth: 24, textAlign: "right" }}>
          {count}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: "#F0F0EE", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, background: "#1C1C1E", width: `${pct}%`, opacity: 0.25 }} />
      </div>
    </div>
  );
}

function TimelineChart({ rows }: { rows: { date: string; count: number }[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 4,
        height: 80,
        padding: "0 4px",
      }}
    >
      {rows.map((r) => {
        const h = Math.max(4, Math.round((r.count / max) * 72));
        return (
          <div
            key={r.date}
            title={`${r.date}: ${r.count} lead${r.count !== 1 ? "s" : ""}`}
            style={{
              flex: 1,
              height: h,
              background: r.count > 0 ? "#E07000" : "#F0F0EE",
              borderRadius: "3px 3px 0 0",
              opacity: r.count > 0 ? 0.8 : 1,
              transition: "height 0.4s ease",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Analytics helpers ─────────────────────────────────────────

function computeStats(leads: LeadDTO[]) {
  const total = leads.length;
  const newCount = leads.filter((l) => l.status === "new").length;
  const replied = leads.filter((l) => l.status === "replied").length;
  const scores = leads.map((l) => l.intent_score ?? 0).filter((s) => s > 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return { total, new: newCount, replied, avgScore };
}

function computeSubredditStats(leads: LeadDTO[]) {
  const map = new Map<string, { count: number; scoreSum: number }>();
  for (const l of leads) {
    const entry = map.get(l.subreddit) ?? { count: 0, scoreSum: 0 };
    entry.count++;
    entry.scoreSum += l.intent_score ?? 0;
    map.set(l.subreddit, entry);
  }
  return Array.from(map.entries())
    .map(([subreddit, { count, scoreSum }]) => ({
      subreddit,
      count,
      avgScore: count > 0 ? Math.round(scoreSum / count) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function computeRelevantSubreddits(leads: LeadDTO[]) {
  const map = new Map<string, { count: number; scoreSum: number; highIntent: number }>();

  for (const lead of leads) {
    const entry = map.get(lead.subreddit) ?? { count: 0, scoreSum: 0, highIntent: 0 };
    const score = lead.intent_score ?? 0;

    entry.count++;
    entry.scoreSum += score;
    if (score >= 80) entry.highIntent++;
    map.set(lead.subreddit, entry);
  }

  const maxCount = Math.max(...Array.from(map.values()).map((entry) => entry.count), 1);

  return Array.from(map.entries())
    .map(([subreddit, entry]) => {
      const avgScore = entry.count > 0 ? Math.round(entry.scoreSum / entry.count) : 0;
      const volumeScore = Math.round((entry.count / maxCount) * 100);
      const highIntentRate = entry.count > 0 ? Math.round((entry.highIntent / entry.count) * 100) : 0;
      const relevancyScore = Math.round(
        avgScore * 0.55 +
        volumeScore * 0.25 +
        highIntentRate * 0.20,
      );

      return {
        subreddit,
        count: entry.count,
        avgScore,
        highIntentRate,
        relevancyScore,
      };
    })
    .sort((a, b) => b.relevancyScore - a.relevancyScore || b.count - a.count);
}

function computeKeywordStats(leads: LeadDTO[]) {
  const map = new Map<string, number>();
  for (const l of leads) {
    for (const kw of l.keywords_matched) {
      map.set(kw, (map.get(kw) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count);
}

function computeTimeline(leads: LeadDTO[]) {
  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const count = leads.filter((l) => l.created_at?.slice(0, 10) === dateStr).length;
    days.push({ date: dateStr, count });
  }
  return days;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

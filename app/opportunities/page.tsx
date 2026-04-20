import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/app/components/auto-refresh";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { listFreshProjectLeads, listProjectLeads } from "@/db/queries/leads";
import type { LeadDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = {
  title: "New Opportunities",
};

type OpportunitiesPageProps = {
  searchParams?: Promise<{ projectId?: string }>;
};

export default async function OpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  const user = await requireUser("/opportunities");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject, projects } = projectState;


  const [freshLeads, allLeads] = await Promise.all([
    listFreshProjectLeads(currentProject.id, 2, 80),
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
  ]);

  const newLeadsCount = allLeads.filter((l) => l.status === "new").length;

  return (
    <DashboardShell
      user={user}
      projects={projects}
      currentProject={currentProject}
      newLeadsCount={newLeadsCount}
    >
      <AutoRefresh intervalMs={60_000} />

      <div className="app-page" style={{ minHeight: "100vh" }}>
        <header className="page-header">
          <div>
            <p className="page-kicker">New Opportunities</p>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FlashIcon />
              Fresh posts — last 2 hours
            </h1>
            <p className="page-copy">
              Posts recientes que matchearon tus keywords. Actualiza automáticamente cada 60 segundos.
            </p>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 14px",
              borderRadius: 8,
              background: freshLeads.length > 0 ? "#FFF3E8" : "#F0F0EE",
              border: `1px solid ${freshLeads.length > 0 ? "rgba(224,112,0,0.25)" : "#E5E5EA"}`,
              fontSize: 13,
              fontWeight: 700,
              color: freshLeads.length > 0 ? "#E07000" : "#AEAEB2",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: freshLeads.length > 0 ? "#E07000" : "#AEAEB2",
                flexShrink: 0,
                animation: freshLeads.length > 0 ? "pulse 2s ease-in-out infinite" : undefined,
              }}
            />
            {freshLeads.length} fresh
          </div>
        </header>

        <div className="content-flow">
          {freshLeads.length === 0 ? (
            <EmptyFeed projectName={currentProject.name} lastScrapedAt={currentProject.last_scraped_at} />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {freshLeads.map((lead) => (
                <FreshLeadRow
                  key={lead.id}
                  lead={lead}
                  projectId={currentProject.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function FreshLeadRow({ lead, projectId }: { lead: LeadDTO; projectId: string }) {
  const ageMs = lead.created_at ? Date.now() - new Date(lead.created_at).getTime() : null;
  const ageMinutes = ageMs !== null ? Math.floor(ageMs / 60_000) : null;
  const isFresh = ageMinutes !== null && ageMinutes < 30;
  const score = lead.intent_score ?? 0;

  const scoreColor =
    score >= 80 ? "#E07000" :
    score >= 60 ? "#FF9F40" :
    score > 0   ? "#AEAEB2" :
    "#D1D1D6";

  return (
    <Link
      href={`/leads/${lead.id}?projectId=${projectId}`}
      style={{ textDecoration: "none" }}
    >
      <div
        className="panel"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          padding: "14px 18px",
          borderRadius: 10,
          border: "1px solid #F0F0EE",
          background: "#FFFFFF",
          cursor: "pointer",
          transition: "border-color 150ms ease, box-shadow 150ms ease",
        }}
      >
        {/* Score badge */}
        <div
          style={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: 8,
            background: score >= 80 ? "#FFF3E8" : "#F0F0EE",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
            {score > 0 ? score : "—"}
          </span>
          <span style={{ fontSize: 8, fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            score
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#E07000",
                background: "#FFF3E8",
                padding: "2px 7px",
                borderRadius: 4,
              }}
            >
              r/{lead.subreddit}
            </span>
            {isFresh && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  background: "#E07000",
                  padding: "2px 7px",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                ⚡ Fresh
              </span>
            )}
            {lead.keywords_matched?.length > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#6B6B6E",
                  background: "#F0F0EE",
                  padding: "2px 7px",
                  borderRadius: 4,
                }}
              >
                {lead.keywords_matched[0]}
                {lead.keywords_matched.length > 1 ? ` +${lead.keywords_matched.length - 1}` : ""}
              </span>
            )}
          </div>

          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#1C1C1E",
              lineHeight: 1.4,
              margin: "0 0 5px",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {lead.title}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 600 }}>
              {ageMinutes !== null ? formatAge(ageMinutes) : ""}
            </span>
            {lead.author && (
              <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 600 }}>
                u/{lead.author}
              </span>
            )}
            {lead.num_comments !== null && lead.num_comments !== undefined && (
              <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 600 }}>
                {lead.num_comments} comentarios
              </span>
            )}
            {(lead.score ?? 0) > 0 && (
              <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 600 }}>
                {lead.score} upvotes
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div
          style={{
            flexShrink: 0,
            color: "#D1D1D6",
            paddingTop: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function EmptyFeed({ projectName, lastScrapedAt }: { projectName: string; lastScrapedAt: string | null }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 24px",
        background: "#FFFFFF",
        border: "1px solid #F0F0EE",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "#F0F0EE",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <FlashIcon size={22} color="#AEAEB2" />
      </div>
      <p style={{ fontSize: 15, fontWeight: 800, color: "#1C1C1E", marginBottom: 6 }}>
        No hay posts frescos
      </p>
      <p style={{ fontSize: 13, color: "#6B6B6E", maxWidth: 360, margin: "0 auto" }}>
        {projectName} no tiene leads nuevos en las últimas 2 horas.{" "}
        {lastScrapedAt
          ? `Último scan ${formatRelative(lastScrapedAt)}.`
          : "El scraper aún no corrió."}
        {" "}Esta página se actualiza automáticamente cada 60 segundos.
      </p>
    </div>
  );
}

function FlashIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 2L4.5 13.5H11L10 22L20 10H13.5L13 2Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatAge(minutes: number): string {
  if (minutes < 1) return "justo ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `hace ${hours}h`;
  return `hace ${hours}h ${mins}min`;
}

function formatRelative(dateStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
  return formatAge(minutes);
}

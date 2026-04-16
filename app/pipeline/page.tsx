import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { listAllProjectLeads, listProjectLeads } from "@/db/queries/leads";
import type { LeadDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = {
  title: "Pipeline",
};

type PipelinePageProps = {
  searchParams?: Promise<{ projectId?: string }>;
};

// ── Column config ──────────────────────────────────────────────

type ColKey = "new" | "reviewing" | "replied" | "won" | "lost";

const COLUMNS: {
  key: ColKey;
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
}[] = [
  { key: "new",       label: "Nuevos",      color: "#E07000", bg: "#FFF3E8", border: "rgba(224,112,0,0.2)", dot: "#E07000" },
  { key: "reviewing", label: "Revisando",   color: "#3B82F6", bg: "#EFF6FF", border: "rgba(59,130,246,0.2)", dot: "#3B82F6" },
  { key: "replied",   label: "Respondidos", color: "#8B5CF6", bg: "#F5F3FF", border: "rgba(139,92,246,0.2)", dot: "#8B5CF6" },
  { key: "won",       label: "Won ✓",       color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0",              dot: "#16A34A" },
  { key: "lost",      label: "Lost ✗",      color: "#DC2626", bg: "#FEF2F2", border: "#FEE2E2",              dot: "#DC2626" },
];

// ── Page ──────────────────────────────────────────────────────

export default async function PipelinePage({ searchParams }: PipelinePageProps) {
  const user = await requireUser("/pipeline");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject, projects } = projectState;

  if (currentProject.onboarding_status !== "completed") {
    redirect(`/onboarding/project?projectId=${currentProject.id}`);
  }

  const [allLeads, recentLeads] = await Promise.all([
    listAllProjectLeads(currentProject.id, 500),
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
  ]);

  const newLeadsCount = recentLeads.filter((l) => l.status === "new").length;

  // Group leads by status
  const byStatus: Record<ColKey, LeadDTO[]> = {
    new: [], reviewing: [], replied: [], won: [], lost: [],
  };
  for (const lead of allLeads) {
    const key = lead.status as ColKey;
    if (key in byStatus) byStatus[key].push(lead);
  }

  // Won value totals
  const wonTotal = byStatus.won.reduce((sum, l) => sum + (l.won_value ?? 0), 0);
  const conversionRate =
    allLeads.length > 0
      ? Math.round((byStatus.won.length / allLeads.length) * 100)
      : 0;

  return (
    <DashboardShell
      user={user}
      projects={projects}
      currentProject={currentProject}
      newLeadsCount={newLeadsCount}
    >
      <div className="app-page" style={{ minHeight: "100vh" }}>
        <header className="page-header">
          <div>
            <p className="page-kicker">Pipeline</p>
            <h1 className="page-title">Funnel de conversión</h1>
            <p className="page-copy">
              {allLeads.length} leads totales · {wonTotal > 0 ? `$${wonTotal.toLocaleString()} won` : "Sin revenue aún"} · {conversionRate}% conversión
            </p>
          </div>

          {/* KPI row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {COLUMNS.map((col) => (
              <div
                key={col.key}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: col.bg,
                  border: `1px solid ${col.border}`,
                  fontSize: 13,
                  fontWeight: 800,
                  color: col.color,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: col.color, opacity: 0.7 }}>
                  {col.label}
                </span>
                {byStatus[col.key].length}
              </div>
            ))}
          </div>
        </header>

        {/* Kanban board */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(220px, 1fr))`,
            gap: 14,
            padding: "0 28px 48px",
            overflowX: "auto",
          }}
        >
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              col={col}
              leads={byStatus[col.key]}
              projectId={currentProject.id}
            />
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function KanbanColumn({
  col,
  leads,
  projectId,
}: {
  col: (typeof COLUMNS)[number];
  leads: LeadDTO[];
  projectId: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      {/* Column header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: 10,
          background: col.bg,
          border: `1px solid ${col.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: col.dot,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 800, color: col.color }}>
            {col.label}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: col.color,
            background: "#FFFFFF",
            padding: "2px 8px",
            borderRadius: 6,
            minWidth: 22,
            textAlign: "center",
          }}
        >
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {leads.length === 0 ? (
          <div
            style={{
              padding: "20px 14px",
              textAlign: "center",
              fontSize: 12,
              color: "#AEAEB2",
              border: "1px dashed #E5E5EA",
              borderRadius: 8,
            }}
          >
            Sin leads
          </div>
        ) : (
          leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              projectId={projectId}
              accentColor={col.color}
            />
          ))
        )}
      </div>
    </div>
  );
}

function KanbanCard({
  lead,
  projectId,
  accentColor,
}: {
  lead: LeadDTO;
  projectId: string;
  accentColor: string;
}) {
  const score = lead.intent_score ?? 0;
  const scoreColor =
    score >= 80 ? "#E07000" : score >= 60 ? "#FF9F40" : "#AEAEB2";
  const updatedAt = lead.updated_at ?? lead.created_at;

  return (
    <Link
      href={`/leads/${lead.id}?projectId=${projectId}`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #F0F0EE",
          borderRadius: 10,
          padding: "12px 14px",
          cursor: "pointer",
          transition: "border-color 150ms ease, box-shadow 150ms ease",
        }}
      >
        {/* Subreddit + score */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 7,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: accentColor,
              background: `${accentColor}18`,
              padding: "2px 7px",
              borderRadius: 4,
              maxWidth: "60%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            r/{lead.subreddit}
          </span>
          {score > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: scoreColor,
              }}
            >
              {score}
            </span>
          )}
        </div>

        {/* Title */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#1C1C1E",
            lineHeight: 1.45,
            marginBottom: 8,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {lead.title}
        </p>

        {/* Won value */}
        {lead.status === "won" && lead.won_value != null && (
          <p
            style={{
              fontSize: 13,
              fontWeight: 900,
              color: "#16A34A",
              marginBottom: 6,
            }}
          >
            ${lead.won_value.toLocaleString()}
          </p>
        )}

        {/* Lost reason */}
        {lead.status === "lost" && lead.lost_reason && (
          <p
            style={{
              fontSize: 11,
              color: "#DC2626",
              marginBottom: 6,
              fontStyle: "italic",
            }}
          >
            {lead.lost_reason}
          </p>
        )}

        {/* Footer */}
        <p style={{ fontSize: 10, color: "#AEAEB2", fontWeight: 600 }}>
          {updatedAt ? formatRelative(updatedAt) : ""}
        </p>
      </div>
    </Link>
  );
}

function formatRelative(dateStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
  if (minutes < 1) return "justo ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { listProjectLeads } from "@/db/queries/leads";
import { listSearchboxResults } from "@/db/queries/searchbox";
import type { LeadDTO, SearchboxResultDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import { toRedditUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Respondidos" };

type Props = {
  searchParams?: Promise<{ projectId?: string }>;
};

export default async function RepliedArchivePage({ searchParams }: Props) {
  const user = await requireUser("/archive/replied");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject, projects } = projectState;

  const [leads, searchboxResults] = await Promise.all([
    listProjectLeads({ projectId: currentProject.id, status: "replied", limit: 100, page: 0 }),
    listSearchboxResults({ projectId: currentProject.id, status: "replied", limit: 100 }),
  ]);

  return (
    <DashboardShell user={user} projects={projects} currentProject={currentProject}>
      <div className="app-page" style={{ maxWidth: 860, padding: "32px 28px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", color: "#1C1C1E" }}>
            Respondidos
          </h1>
          <p style={{ fontSize: 13, color: "#6B6B6E", marginTop: 4 }}>
            Posts a los que ya respondiste. Se mantienen aquí como registro.
          </p>
        </div>

        {leads.length === 0 && searchboxResults.length === 0 ? (
          <EmptyState label="No hay posts respondidos todavía." />
        ) : (
          <>
            {leads.length > 0 && (
              <Section title="Oportunidades" count={leads.length}>
                {leads.map((lead) => (
                  <ArchiveCard
                    key={lead.id}
                    title={lead.title}
                    subreddit={lead.subreddit}
                    date={lead.replied_at ?? lead.created_at}
                    dateLabel="Respondido"
                    score={lead.intent_score}
                    reason={lead.classification_reason}
                    permalink={lead.permalink}
                    statusColor="#16A34A"
                  />
                ))}
              </Section>
            )}

            {searchboxResults.length > 0 && (
              <Section title="Searchbox" count={searchboxResults.length} style={{ marginTop: 32 }}>
                {searchboxResults.map((r) => (
                  <ArchiveCard
                    key={r.id}
                    title={r.title}
                    subreddit={r.subreddit}
                    date={r.created_at}
                    dateLabel="Encontrado"
                    score={r.intent_score}
                    reason={r.classification_reason}
                    permalink={r.permalink}
                    statusColor="#16A34A"
                    badge={`Google #${r.google_rank} · ${r.google_keyword}`}
                  />
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function Section({
  title,
  count,
  children,
  style,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#6B6B6E", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {title}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#AEAEB2" }}>{count}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function ArchiveCard({
  title,
  subreddit,
  date,
  dateLabel,
  score,
  reason,
  permalink,
  statusColor,
  badge,
}: {
  title: string;
  subreddit: string;
  date: string | null;
  dateLabel: string;
  score: number | null;
  reason: string | null;
  permalink: string;
  statusColor: string;
  badge?: string;
}) {
  return (
    <div style={{
      background: "#FFF",
      border: "1px solid #EEEEED",
      borderRadius: 10,
      padding: "12px 14px",
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E", lineHeight: 1.3 }}>{title}</p>
          {score !== null && (
            <span style={{
              fontSize: 11, fontWeight: 900, flexShrink: 0,
              color: score >= 80 ? "#E07000" : score >= 60 ? "#FF9F40" : "#AEAEB2",
            }}>
              {score}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 500 }}>r/{subreddit}</span>
          {date && (
            <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 500 }}>
              {dateLabel} {formatDate(date)}
            </span>
          )}
          {badge && (
            <span style={{ fontSize: 10, fontWeight: 800, color: "#4338CA", background: "#EEF2FF", padding: "2px 7px", borderRadius: 5 }}>
              {badge}
            </span>
          )}
        </div>
        {reason && (
          <p style={{ fontSize: 11, color: "#6B6B6E", marginTop: 5, lineHeight: 1.4 }}>
            {reason.slice(0, 140)}
          </p>
        )}
        <a
          href={toRedditUrl(permalink)}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 11, color: "#E07000", fontWeight: 700, textDecoration: "none", marginTop: 6, display: "inline-block" }}
        >
          Ver en Reddit →
        </a>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", color: "#AEAEB2" }}>
      <p style={{ fontSize: 14, fontWeight: 600 }}>{label}</p>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

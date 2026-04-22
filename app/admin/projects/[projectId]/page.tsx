import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProjectDetail } from "@/db/queries/admin";
import {
  deleteAdminProject,
  retryProjectBackfill,
  retryProjectSearchbox,
  updateAdminProjectStatus,
} from "@/modules/admin/actions";

export const metadata: Metadata = { title: "Admin — Project detail" };

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function AdminProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const detail = await getAdminProjectDetail(projectId);

  if (!detail) notFound();

  const activeKeywords = detail.keywords.filter((keyword) => keyword.is_active);

  return (
    <div className="app-page">
      <header className="page-header">
        <p className="page-kicker">Admin / Project</p>
        <h1 className="page-title">{detail.project.name}</h1>
        <p className="page-copy">
          {detail.project.owner_email} · {detail.project.website_url ?? "No website"} · created {formatFullDate(detail.project.created_at)}
        </p>
      </header>

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px 48px", display: "grid", gap: 18 }}>
        <section style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h2 style={sectionTitleStyle}>Health</h2>
              <p style={sectionCopyStyle}>Quick operational snapshot for onboarding, Searchbox and scraping.</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={`/dashboard?projectId=${detail.project.id}`} style={actionLinkStyle}>Open in app</Link>
              <form action={retryProjectSearchbox}>
                <input type="hidden" name="projectId" value={detail.project.id} />
                <button type="submit" style={actionButtonStyle}>Retry Searchbox</button>
              </form>
              <form action={retryProjectBackfill}>
                <input type="hidden" name="projectId" value={detail.project.id} />
                <button type="submit" style={actionButtonStyle}>Retry Backfill</button>
              </form>
            </div>
          </div>

          <div style={metricsGridStyle}>
            <MetricCard label="Project status" value={detail.project.status} />
            <MetricCard label="Onboarding" value={detail.project.onboarding_status} />
            <MetricCard label="Active keywords" value={String(activeKeywords.length)} />
            <MetricCard label="Searchbox results" value={String(detail.project.searchbox_results_count)} />
            <MetricCard label="Leads" value={String(detail.project.leads_count)} />
            <MetricCard label="Last Searchbox" value={detail.project.last_searchbox_at ? formatFullDate(detail.project.last_searchbox_at) : "Never"} />
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr", gap: 18, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 18 }}>
            <section style={panelStyle}>
              <h2 style={sectionTitleStyle}>Recent Searchbox Results</h2>
              <p style={sectionCopyStyle}>Latest persisted Searchbox posts for this project.</p>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {detail.recentSearchboxResults.length === 0 ? (
                  <EmptyLine>No Searchbox results stored yet.</EmptyLine>
                ) : detail.recentSearchboxResults.map((result) => (
                  <div key={result.id} style={listRowStyle}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>{result.title}</div>
                      <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 4 }}>
                        r/{result.subreddit} · {result.google_keyword} · Google #{result.google_rank}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#E07000" }}>{result.intent_score ?? "—"}</div>
                      <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 4 }}>{result.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={panelStyle}>
              <h2 style={sectionTitleStyle}>Recent Scrape Runs</h2>
              <p style={sectionCopyStyle}>Latest Reddit scraping runs associated with this project.</p>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {detail.recentScrapeRuns.length === 0 ? (
                  <EmptyLine>No scrape runs yet.</EmptyLine>
                ) : detail.recentScrapeRuns.map((run) => (
                  <div key={run.id} style={listRowStyle}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>{run.status}</div>
                      <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 4 }}>
                        {formatFullDate(run.started_at)} · posts {run.posts_seen} · leads {run.leads_created} · dupes {run.duplicates_skipped}
                      </div>
                    </div>
                    <div style={{ maxWidth: 260, fontSize: 11, color: "#991B1B", textAlign: "right" }}>
                      {run.error_message ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            <section style={panelStyle}>
              <h2 style={sectionTitleStyle}>Costs</h2>
              <p style={sectionCopyStyle}>Recent API usage registered for this project.</p>
              <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
                <MiniMetric label="Total cost" value={`$${detail.usage.totalCostUsd.toFixed(4)}`} />
                <MiniMetric label="Last 24h" value={`$${detail.usage.last24hCostUsd.toFixed(4)}`} />
              </div>
              <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
                {detail.usage.operations.length === 0 ? (
                  <EmptyLine>No tracked API usage.</EmptyLine>
                ) : detail.usage.operations.slice(0, 8).map((operation) => (
                  <div key={operation.operation} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}>
                    <span style={{ color: "#6B6B6E", fontWeight: 600 }}>{operation.operation}</span>
                    <span style={{ color: "#1C1C1E", fontWeight: 800 }}>
                      {operation.requests} req · ${operation.costUsd.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section style={panelStyle}>
              <h2 style={sectionTitleStyle}>Keywords</h2>
              <p style={sectionCopyStyle}>Most recent project keywords and competitor terms.</p>
              <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
                {detail.keywords.length === 0 ? (
                  <EmptyLine>No keywords.</EmptyLine>
                ) : detail.keywords.slice(0, 20).map((keyword) => (
                  <div key={keyword.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}>
                    <span style={{ color: keyword.is_active ? "#1C1C1E" : "#AEAEB2", fontWeight: 600 }}>{keyword.term}</span>
                    <span style={{ color: "#8E8E93", fontWeight: 700 }}>
                      {keyword.type} {keyword.intent_category ? `· ${keyword.intent_category}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section style={panelStyle}>
              <h2 style={{ ...sectionTitleStyle, color: "#991B1B" }}>Danger Zone</h2>
              <p style={sectionCopyStyle}>Archive, suspend or delete this project from the admin surface.</p>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <form action={updateAdminProjectStatus} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="hidden" name="projectId" value={detail.project.id} />
                  <select name="status" defaultValue={detail.project.status} style={selectStyle}>
                    <option value="active">active</option>
                    <option value="archived">archived</option>
                    <option value="suspended">suspended</option>
                  </select>
                  <button type="submit" style={actionButtonStyle}>Save status</button>
                </form>

                <form action={deleteAdminProject} style={{ display: "grid", gap: 8 }}>
                  <input type="hidden" name="projectId" value={detail.project.id} />
                  <input name="confirmation" placeholder="DELETE" autoComplete="off" required style={inputStyle} />
                  <button type="submit" style={{ ...actionButtonStyle, background: "#DC2626" }}>Delete project</button>
                </form>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#FAFAF8", border: "1px solid #F0F0EE", borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: "#1C1C1E", marginTop: 8 }}>{value}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}>
      <span style={{ color: "#6B6B6E", fontWeight: 600 }}>{label}</span>
      <span style={{ color: "#1C1C1E", fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: "#8E8E93" }}>{children}</div>;
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const panelStyle = {
  background: "#FFFFFF",
  border: "1px solid #F0F0EE",
  borderRadius: 12,
  padding: "20px 22px",
} as const;

const sectionTitleStyle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#1C1C1E",
} as const;

const sectionCopyStyle = {
  fontSize: 12,
  color: "#6B6B6E",
  marginTop: 4,
  lineHeight: 1.5,
} as const;

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
  marginTop: 18,
} as const;

const listRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  borderBottom: "1px solid #F5F5F3",
  paddingBottom: 10,
} as const;

const actionButtonStyle = {
  fontSize: 11,
  fontWeight: 800,
  color: "#FFFFFF",
  background: "#1C1C1E",
  border: "none",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
} as const;

const actionLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: 800,
  color: "#E07000",
  background: "#FFF7ED",
  border: "1px solid #FED7AA",
  borderRadius: 8,
  padding: "8px 12px",
  textDecoration: "none",
} as const;

const selectStyle = {
  fontSize: 12,
  border: "1px solid #E5E5E3",
  borderRadius: 8,
  padding: "8px 10px",
  background: "#fff",
  color: "#1C1C1E",
  flex: 1,
} as const;

const inputStyle = {
  fontSize: 12,
  border: "1px solid #E5E5E3",
  borderRadius: 8,
  padding: "8px 10px",
  background: "#fff",
  color: "#1C1C1E",
} as const;

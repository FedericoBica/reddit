import type { Metadata } from "next";
import Link from "next/link";
import { listAdminProjects } from "@/db/queries/admin";

export const metadata: Metadata = { title: "Admin — Projects" };

const HEALTH_STYLES: Record<string, { bg: string; color: string }> = {
  healthy: { bg: "#DCFCE7", color: "#166534" },
  duplicate_candidate: { bg: "#FEE2E2", color: "#991B1B" },
  searchbox_empty: { bg: "#FEF3C7", color: "#92400E" },
  missing_keywords: { bg: "#E0F2FE", color: "#075985" },
  jobs_failing: { bg: "#FECACA", color: "#991B1B" },
};

export default async function AdminProjectsPage() {
  const projects = await listAdminProjects(250);

  return (
    <div className="app-page">
      <header className="page-header">
        <p className="page-kicker">Admin</p>
        <h1 className="page-title">Projects ({projects.length})</h1>
        <p className="page-copy">Operational view of onboarding, Searchbox, scraping and duplicate risk.</p>
      </header>

      <section style={{ maxWidth: 1380, margin: "0 auto", padding: "0 32px 40px" }}>
        <div style={{ background: "#fff", border: "1px solid #F0F0EE", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F0F0EE", background: "#FAFAF8" }}>
                {["Project", "Owner", "Health", "Keywords", "Searchbox", "Leads", "Onboarding", "Last scan", "Actions"].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#8E8E93",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => {
                const healthStyle = HEALTH_STYLES[project.health] ?? { bg: "#F3F4F6", color: "#4B5563" };
                return (
                  <tr key={project.id} style={{ borderBottom: index < projects.length - 1 ? "1px solid #F5F5F3" : "none" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>{project.name}</div>
                      <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 2 }}>{project.website_url ?? "No website"}</div>
                      <div style={{ fontSize: 10, color: "#AEAEB2", marginTop: 4 }}>{project.id}</div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#6B6B6E" }}>{project.owner_email}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999, background: healthStyle.bg, color: healthStyle.color }}>
                        {project.health.replaceAll("_", " ")}
                      </span>
                      {project.duplicate_count > 1 && (
                        <div style={{ fontSize: 10, color: "#991B1B", marginTop: 5 }}>{project.duplicate_count} duplicates</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>{project.keywords_count}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>{project.searchbox_results_count}</div>
                      <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 2 }}>
                        {project.last_searchbox_at ? formatDate(project.last_searchbox_at) : "Never scanned"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>{project.leads_count}</td>
                    <td style={{ padding: "12px 14px", fontSize: 11, color: "#6B6B6E", fontWeight: 700 }}>{project.onboarding_status}</td>
                    <td style={{ padding: "12px 14px", fontSize: 11, color: "#8E8E93" }}>
                      {project.latest_scrape_status ? `${project.latest_scrape_status} / ${project.last_scraped_at ? formatDate(project.last_scraped_at) : "never"}` : (project.last_scraped_at ? formatDate(project.last_scraped_at) : "Never")}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link href={`/admin/projects/${project.id}`} style={smallButtonStyle("#1C1C1E", "#FFFFFF")}>
                          Inspect
                        </Link>
                        <Link href={`/dashboard?projectId=${project.id}`} style={smallButtonStyle("#FFFFFF", "#E07000")}>
                          Open in app
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function smallButtonStyle(color: string, background: string) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    padding: "6px 10px",
    textDecoration: "none",
    fontSize: 11,
    fontWeight: 800,
    background,
    color,
    border: `1px solid ${background === "#FFFFFF" ? "#E5E7EB" : background}`,
  } as const;
}

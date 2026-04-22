import type { Metadata } from "next";
import Link from "next/link";
import { getAdminOverview } from "@/db/queries/admin";

export const metadata: Metadata = { title: "Admin — Overview" };

export default async function AdminStatsPage() {
  const overview = await getAdminOverview();

  const cards = [
    { label: "Total users", value: overview.stats.totalUsers },
    { label: "Active projects", value: overview.stats.totalProjects },
    { label: "Searchbox results", value: overview.stats.totalSearchboxResults },
    { label: "Searchbox 24h", value: overview.stats.searchboxResults24h },
    { label: "Failed scrape runs 24h", value: overview.stats.failedScrapeRuns24h },
    { label: "AI/API spend 24h", value: `$${overview.stats.apiSpend24hUsd.toFixed(4)}` },
  ];

  return (
    <div className="app-page">
      <header className="page-header">
        <p className="page-kicker">Admin</p>
        <h1 className="page-title">Overview</h1>
        <p className="page-copy">Fast operational visibility into users, projects, Searchbox and failures.</p>
      </header>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 40px", display: "grid", gap: 18 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {cards.map((card) => (
            <div
              key={card.label}
              style={{
                background: "#fff",
                border: "1px solid #F0F0EE",
                borderRadius: 8,
                padding: "20px 24px",
              }}
            >
              <p style={{ fontSize: 12, color: "#8E8E93", fontWeight: 600, marginBottom: 8 }}>
                {card.label}
              </p>
              <p style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", color: "#1C1C1E" }}>
                {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 18 }}>
          <section style={{ background: "#fff", border: "1px solid #F0F0EE", borderRadius: 10, padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1C1C1E" }}>Alerts</h2>
                <p style={{ fontSize: 12, color: "#6B6B6E", marginTop: 4 }}>Duplicate risk, empty Searchbox scans and failed jobs.</p>
              </div>
              <Link href="/admin/projects" style={{ fontSize: 11, fontWeight: 800, color: "#E07000", textDecoration: "none" }}>
                View projects
              </Link>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {overview.alerts.length === 0 ? (
                <p style={{ fontSize: 12, color: "#8E8E93" }}>No active alerts.</p>
              ) : overview.alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.project_id ? `/admin/projects/${alert.project_id}` : "/admin/projects"}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    border: "1px solid #F1F1EF",
                    borderRadius: 10,
                    padding: "12px 14px",
                    background: alert.severity === "high" ? "#FFF7F7" : "#FFFBEB",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#1C1C1E" }}>{alert.title}</div>
                  <div style={{ fontSize: 11, color: "#6B6B6E", marginTop: 4, lineHeight: 1.45 }}>{alert.description}</div>
                  {alert.owner_email && (
                    <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 6 }}>{alert.owner_email}</div>
                  )}
                </Link>
              ))}
            </div>
          </section>

          <section style={{ background: "#fff", border: "1px solid #F0F0EE", borderRadius: 10, padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1C1C1E" }}>Recent projects</h2>
                <p style={{ fontSize: 12, color: "#6B6B6E", marginTop: 4 }}>Newest projects and their operational health.</p>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {overview.recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/admin/projects/${project.id}`}
                  style={{
                    display: "grid",
                    gap: 4,
                    textDecoration: "none",
                    border: "1px solid #F1F1EF",
                    borderRadius: 10,
                    padding: "12px 14px",
                    background: "#FAFAF8",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#1C1C1E" }}>{project.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#E07000" }}>{project.health}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6B6B6E" }}>{project.owner_email}</div>
                  <div style={{ fontSize: 10, color: "#8E8E93" }}>
                    {project.keywords_count} keywords · {project.searchbox_results_count} searchbox · {project.leads_count} leads
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

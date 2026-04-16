import type { Metadata } from "next";
import { getAdminStats } from "@/db/queries/admin";

export const metadata: Metadata = { title: "Admin — Stats" };

export default async function AdminStatsPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Usuarios totales", value: stats.totalUsers },
    { label: "Proyectos activos", value: stats.totalProjects },
    { label: "Leads totales", value: stats.totalLeads },
    { label: "Leads últimos 7 días", value: stats.leadsLast7Days },
    { label: "Leads últimos 30 días", value: stats.leadsLast30Days },
    { label: "AI replies generadas", value: stats.totalReplies },
    { label: "Scrape runs totales", value: stats.totalScrapeRuns },
  ];

  return (
    <div className="app-page">
      <header className="page-header">
        <p className="page-kicker">Admin</p>
        <h1 className="page-title">Stats globales</h1>
      </header>

      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 32px 40px" }}>
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
                {card.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

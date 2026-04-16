import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAdminStats } from "@/db/queries/admin";

export const metadata: Metadata = { title: "Admin — Stats" };

export default async function AdminStatsPage() {
  const [stats, t] = await Promise.all([
    getAdminStats(),
    getTranslations("admin.stats"),
  ]);

  const cards = [
    { label: t("totalUsers"), value: stats.totalUsers },
    { label: t("totalProjects"), value: stats.totalProjects },
    { label: t("totalLeads"), value: stats.totalLeads },
    { label: t("leads7Days"), value: stats.leadsLast7Days },
    { label: t("leads30Days"), value: stats.leadsLast30Days },
    { label: t("totalReplies"), value: stats.totalReplies },
    { label: t("totalScrapeRuns"), value: stats.totalScrapeRuns },
  ];

  return (
    <div className="app-page">
      <header className="page-header">
        <p className="page-kicker">{t("kicker")}</p>
        <h1 className="page-title">{t("title")}</h1>
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

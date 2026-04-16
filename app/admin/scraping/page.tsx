import type { Metadata } from "next";
import { listAdminScrapeLogs } from "@/db/queries/admin";

export const metadata: Metadata = { title: "Admin — Scraping logs" };

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  completed: { bg: "#D1FAE5", color: "#065F46" },
  failed:    { bg: "#FEE2E2", color: "#991B1B" },
  skipped:   { bg: "#FEF3C7", color: "#92400E" },
  started:   { bg: "#DBEAFE", color: "#1E40AF" },
};

export default async function AdminScrapingPage() {
  const logs = await listAdminScrapeLogs(200);

  return (
    <div className="app-page">
      <header className="page-header">
        <p className="page-kicker">Admin</p>
        <h1 className="page-title">Scraping logs</h1>
        <p className="page-copy">Últimas 200 ejecuciones de scraping.</p>
      </header>

      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 40px" }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #F0F0EE",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F0F0EE", background: "#FAFAF8" }}>
                {["Proyecto", "Owner", "Estado", "Inicio", "Posts vistos", "Leads", "Dupes", "Error"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#8E8E93",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const statusStyle = STATUS_COLORS[log.status] ?? { bg: "#F5F5F3", color: "#6B6B6E" };
                return (
                  <tr
                    key={log.id}
                    style={{ borderBottom: i < logs.length - 1 ? "1px solid #F5F5F3" : "none" }}
                  >
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#1C1C1E" }}>
                      {log.project_name}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#6B6B6E" }}>
                      {log.owner_email}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 5,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          textTransform: "capitalize",
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#6B6B6E", whiteSpace: "nowrap" }}>
                      {new Date(log.started_at).toLocaleString("es-AR", {
                        day: "2-digit", month: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#1C1C1E", fontWeight: 600, textAlign: "center" }}>
                      {log.posts_seen}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: log.leads_created > 0 ? "#065F46" : "#1C1C1E", textAlign: "center" }}>
                      {log.leads_created}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#8E8E93", textAlign: "center" }}>
                      {log.duplicates_skipped}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 11, color: "#991B1B", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.error_message ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {logs.length === 0 && (
            <p style={{ padding: 24, fontSize: 13, color: "#8E8E93", textAlign: "center" }}>
              No hay logs de scraping todavía.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

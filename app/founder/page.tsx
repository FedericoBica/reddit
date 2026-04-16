import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/modules/auth/server";

export const metadata: Metadata = {
  title: "Founder Dashboard",
};

// Gate: only allow users whose email matches FOUNDER_EMAIL env var
async function requireFounder() {
  const user = await requireUser("/founder");
  const founderEmail = process.env.FOUNDER_EMAIL ?? "";

  if (!founderEmail || user.email !== founderEmail) {
    redirect("/dashboard");
  }

  return user;
}

export default async function FounderPage() {
  await requireFounder();

  const supabase = createSupabaseAdminClient();

  // ── Fetch all data ──────────────────────────────────────────
  const [
    { data: authUsers },
    { data: projects },
    { data: leads },
    { data: scrapeRuns },
  ] = await Promise.all([
    supabase.auth.admin.listUsers({ perPage: 500 }),
    supabase.from("projects").select("id, name, created_at, onboarding_status, last_scraped_at, scrape_fail_count"),
    supabase.from("leads").select("id, project_id, status, intent_score, won_value, created_at, replied_at"),
    supabase.from("project_scrape_runs").select("id, project_id, status, leads_created, posts_seen, started_at").order("started_at", { ascending: false }).limit(100),
  ]);

  const allUsers = authUsers?.users ?? [];
  const allProjects = projects ?? [];
  const allLeads = leads ?? [];
  const allRuns = scrapeRuns ?? [];

  // ── Stats ───────────────────────────────────────────────────
  const totalUsers = allUsers.length;
  const totalProjects = allProjects.length;
  const totalLeads = allLeads.length;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000);

  const newUsersThisWeek = allUsers.filter(
    (u) => new Date(u.created_at) >= weekAgo
  ).length;
  const leadsThisWeek = allLeads.filter(
    (l) => new Date(l.created_at) >= weekAgo
  ).length;
  const leadsThisMonth = allLeads.filter(
    (l) => new Date(l.created_at) >= monthAgo
  ).length;

  const wonLeads = allLeads.filter((l) => l.status === "won");
  const totalRevenue = wonLeads.reduce((s, l) => s + ((l.won_value as number) ?? 0), 0);
  const repliedLeads = allLeads.filter((l) => l.status === "replied" || l.status === "won").length;
  const conversionRate =
    repliedLeads > 0 ? Math.round((wonLeads.length / repliedLeads) * 100) : 0;

  // Successful scrape runs
  const successRuns = allRuns.filter((r) => r.status === "completed").length;
  const failRuns = allRuns.filter((r) => r.status === "failed").length;
  const totalPostsSeen = allRuns.reduce((s, r) => s + ((r.posts_seen as number) ?? 0), 0);
  const totalLeadsCreated = allRuns.reduce((s, r) => s + ((r.leads_created as number) ?? 0), 0);

  // Top projects by lead count
  const leadsByProject: Record<string, number> = {};
  for (const lead of allLeads) {
    leadsByProject[lead.project_id] = (leadsByProject[lead.project_id] ?? 0) + 1;
  }
  const topProjects = allProjects
    .map((p) => ({ ...p, leadCount: leadsByProject[p.id] ?? 0 }))
    .sort((a, b) => b.leadCount - a.leadCount)
    .slice(0, 10);

  // Recent users
  const recentUsers = [...allUsers]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FAFAF8",
        padding: "32px 28px 64px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#AEAEB2",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 6,
          }}
        >
          Internal
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1C1C1E", margin: 0 }}>
          Founder Dashboard
        </h1>
        <p style={{ fontSize: 13, color: "#6B6B6E", marginTop: 6 }}>
          Métricas internas — solo visible para {process.env.FOUNDER_EMAIL ?? "admin"}.
        </p>
      </div>

      {/* KPI grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <KpiCard label="Usuarios totales" value={totalUsers} sub={`+${newUsersThisWeek} esta semana`} />
        <KpiCard label="Proyectos" value={totalProjects} sub={`${allProjects.filter(p => p.onboarding_status === "completed").length} completados`} />
        <KpiCard label="Leads totales" value={totalLeads} sub={`${leadsThisWeek} esta semana`} accent />
        <KpiCard label="Revenue (won)" value={totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : "—"} sub={`${wonLeads.length} leads won · ${conversionRate}% conv.`} highlight />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Scraper stats */}
        <Panel title="Scraper">
          <div style={{ display: "grid", gap: 12 }}>
            <StatRow label="Runs (últimas 100)" value={allRuns.length} />
            <StatRow label="Exitosos" value={successRuns} valueColor="#16A34A" />
            <StatRow label="Fallidos" value={failRuns} valueColor={failRuns > 0 ? "#DC2626" : "#1C1C1E"} />
            <StatRow label="Posts vistos" value={totalPostsSeen.toLocaleString()} />
            <StatRow label="Leads creados" value={totalLeadsCreated.toLocaleString()} />
            <StatRow
              label="Tasa de calificación"
              value={totalPostsSeen > 0 ? `${((totalLeadsCreated / totalPostsSeen) * 100).toFixed(1)}%` : "—"}
            />
          </div>
        </Panel>

        {/* Lead funnel */}
        <Panel title="Funnel global">
          {(["new","reviewing","replied","won","lost","irrelevant"] as const).map((status) => {
            const count = allLeads.filter((l) => l.status === status).length;
            const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
            const color =
              status === "won" ? "#16A34A" :
              status === "lost" ? "#DC2626" :
              status === "replied" ? "#8B5CF6" :
              status === "reviewing" ? "#3B82F6" :
              status === "new" ? "#E07000" : "#D1D1D6";
            return (
              <div key={status} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1C1C1E", textTransform: "capitalize" }}>
                    {status}
                  </span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 700 }}>{pct}%</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#1C1C1E", minWidth: 28, textAlign: "right" }}>{count}</span>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: "#F0F0EE", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, background: color, width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Top projects */}
        <Panel title="Top proyectos por leads">
          <div style={{ display: "grid", gap: 8 }}>
            {topProjects.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#AEAEB2", width: 16 }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: 10, color: "#AEAEB2" }}>
                    {p.onboarding_status === "completed" ? "activo" : p.onboarding_status} ·{" "}
                    {p.last_scraped_at ? `scan ${formatRelative(p.last_scraped_at)}` : "sin scans"}
                  </p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#E07000" }}>
                  {p.leadCount}
                </span>
              </div>
            ))}
            {topProjects.length === 0 && (
              <p style={{ fontSize: 13, color: "#AEAEB2" }}>Sin proyectos aún.</p>
            )}
          </div>
        </Panel>

        {/* Recent signups */}
        <Panel title="Últimos registros">
          <div style={{ display: "grid", gap: 8 }}>
            {recentUsers.map((u) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#F0F0EE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#6B6B6E",
                    flexShrink: 0,
                  }}
                >
                  {(u.email?.[0] ?? "?").toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.email}
                  </p>
                  <p style={{ fontSize: 10, color: "#AEAEB2" }}>
                    {formatRelative(u.created_at)}
                  </p>
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <p style={{ fontSize: 13, color: "#AEAEB2" }}>Sin usuarios aún.</p>
            )}
          </div>
        </Panel>
      </div>

      {/* Recent scrape runs */}
      <Panel title="Últimos scrape runs">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Proyecto", "Estado", "Posts vistos", "Leads creados", "Inicio"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "6px 10px",
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#AEAEB2",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      borderBottom: "1px solid #F0F0EE",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allRuns.slice(0, 20).map((run) => {
                const proj = allProjects.find((p) => p.id === run.project_id);
                const ok = run.status === "completed";
                return (
                  <tr key={run.id} style={{ borderBottom: "1px solid #F0F0EE" }}>
                    <td style={{ padding: "8px 10px", color: "#1C1C1E", fontWeight: 600 }}>
                      {proj?.name ?? run.project_id.slice(0, 8)}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: ok ? "#16A34A" : "#DC2626",
                          background: ok ? "#F0FDF4" : "#FEF2F2",
                          padding: "2px 7px",
                          borderRadius: 4,
                        }}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td style={{ padding: "8px 10px", color: "#6B6B6E" }}>{run.posts_seen ?? "—"}</td>
                    <td style={{ padding: "8px 10px", color: "#6B6B6E" }}>{run.leads_created ?? "—"}</td>
                    <td style={{ padding: "8px 10px", color: "#AEAEB2" }}>
                      {run.started_at ? formatRelative(run.started_at) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {allRuns.length === 0 && (
            <p style={{ fontSize: 13, color: "#AEAEB2", padding: "16px 0" }}>Sin runs aún.</p>
          )}
        </div>
      </Panel>
    </main>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent = false,
  highlight = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #F0F0EE",
        borderRadius: 12,
        padding: "18px 20px",
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, color: "#AEAEB2", marginBottom: 6 }}>{label}</p>
      <p
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: highlight ? "#16A34A" : accent ? "#E07000" : "#1C1C1E",
          lineHeight: 1.1,
          marginBottom: 4,
        }}
      >
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: "#6B6B6E" }}>{sub}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #F0F0EE",
        borderRadius: 12,
        padding: "18px 20px",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "#AEAEB2",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 16,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function StatRow({
  label,
  value,
  valueColor = "#1C1C1E",
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "#6B6B6E", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: valueColor }}>{value}</span>
    </div>
  );
}

function formatRelative(dateStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
  if (minutes < 1) return "justo ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString("es", { month: "short", day: "numeric" });
}

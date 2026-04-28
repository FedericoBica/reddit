import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = { title: "Content Studio" };

const TABS = ["Search Post", "AI Writer", "Strategy"] as const;

export default async function XStudioPage({ searchParams }: { searchParams?: Promise<{ projectId?: string }> }) {
  const user = await requireUser("/x/studio");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);
  if (projectState.status === "missing") redirect("/bootstrap");
  const { currentProject } = projectState;

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page">
        <header className="page-header">
          <div>
            <p className="page-kicker">X · Content Studio</p>
            <h1 className="page-title">Content Studio</h1>
            <p className="page-copy">Write in your voice, optimize for engagement, and schedule for maximum reach.</p>
          </div>
        </header>
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 60px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
            {TABS.map((tab) => (
              <span key={tab} className={`filter-pill${tab === "AI Writer" ? " filter-pill-active" : ""}`}>
                {tab}
              </span>
            ))}
          </div>

          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 16 }}>✍️</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1B", marginBottom: 8 }}>Coming soon</p>
            <p style={{ fontSize: 14, color: "#7C7C83", maxWidth: 440, margin: "0 auto" }}>
              AI writes posts in your voice, optimizes hooks and flow, then schedules them for when your audience is most active.
            </p>
          </div>
        </main>
      </div>
    </DashboardShell>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = { title: "Engage" };

export default async function XEngagePage({ searchParams }: { searchParams?: Promise<{ projectId?: string }> }) {
  const user = await requireUser("/x/engage");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);
  if (projectState.status === "missing") redirect("/bootstrap");
  const { currentProject } = projectState;

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page">
        <header className="page-header">
          <div>
            <p className="page-kicker">X · Engage</p>
            <h1 className="page-title">Strategic Engagement</h1>
            <p className="page-copy">See where to engage for maximum visibility. Replies designed for reach, not just response.</p>
          </div>
        </header>
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>🎯</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1B", marginBottom: 8 }}>Coming soon</p>
          <p style={{ fontSize: 14, color: "#7C7C83", maxWidth: 440, margin: "0 auto" }}>
            High-value posts to reply to right now, visibility-boosting reply suggestions, and engagement-to-follower tracking — all in one feed.
          </p>
        </main>
      </div>
    </DashboardShell>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = { title: "My Queue" };

export default async function XQueuePage({ searchParams }: { searchParams?: Promise<{ projectId?: string }> }) {
  const user = await requireUser("/x/queue");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);
  if (projectState.status === "missing") redirect("/bootstrap");
  const { currentProject } = projectState;

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page">
        <header className="page-header">
          <div>
            <p className="page-kicker">X · My Queue</p>
            <h1 className="page-title">Posts Queue</h1>
            <p className="page-copy">Schedule posts to publish automatically at the day and time you choose.</p>
          </div>
        </header>
        <main style={{ maxWidth: 680, margin: "0 auto", padding: "48px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>📅</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1B", marginBottom: 8 }}>Coming soon</p>
          <p style={{ fontSize: 14, color: "#7C7C83", maxWidth: 400, margin: "0 auto" }}>
            Your scheduled posts will appear here. Create a post from Content Studio and set a publish time to get started.
          </p>
        </main>
      </div>
    </DashboardShell>
  );
}

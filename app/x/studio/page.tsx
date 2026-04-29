import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import { getXProfile } from "@/modules/x/context-actions";
import { AIWriterTab } from "./ai-writer-tab";

export const metadata: Metadata = { title: "Content Studio" };

export default async function XStudioPage({ searchParams }: { searchParams?: Promise<{ projectId?: string; tab?: string }> }) {
  const user = await requireUser("/x/studio");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);
  if (projectState.status === "missing") redirect("/bootstrap");
  const { currentProject } = projectState;

  const profile = await getXProfile(currentProject.id);
  const hasProfile = !!profile;

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
          <AIWriterTab projectId={currentProject.id} hasProfile={hasProfile} />
        </main>
      </div>
    </DashboardShell>
  );
}

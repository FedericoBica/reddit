import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import { getXProfile } from "@/modules/x/context-actions";
import { getConnectedAccount } from "@/modules/x/x-oauth";
import { XContextForm } from "./context-form";

export const metadata: Metadata = { title: "My X Context" };

export default async function XContextPage({
  searchParams,
}: {
  searchParams?: Promise<{ projectId?: string }>;
}) {
  const user = await requireUser("/x/context");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);
  if (projectState.status === "missing") redirect("/bootstrap");
  const { currentProject } = projectState;

  const [profile, connectedAccount] = await Promise.all([
    getXProfile(currentProject.id),
    getConnectedAccount(currentProject.id),
  ]);

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page">
        <header className="page-header">
          <div>
            <p className="page-kicker">X · My Context</p>
            <h1 className="page-title">Your X Profile</h1>
            <p className="page-copy">This context shapes all AI-generated posts, suggestions, and replies.</p>
          </div>
        </header>

        <main style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 60px" }}>
          <XContextForm
            profile={profile}
            connectedAccount={connectedAccount}
            projectId={currentProject.id}
          />
        </main>
      </div>
    </DashboardShell>
  );
}

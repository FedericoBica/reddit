import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
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
  const locale = await getLocale();
  const copy = locale.startsWith("es")
    ? {
        kicker: "X · Content Studio",
        title: "Content Studio",
        description: "Escribí con tu voz, optimizá para engagement y programá para lograr el máximo alcance.",
      }
    : locale.startsWith("pt")
    ? {
        kicker: "X · Content Studio",
        title: "Content Studio",
        description: "Escreva com a sua voz, otimize para engajamento e agende para obter o máximo alcance.",
      }
    : {
        kicker: "X · Content Studio",
        title: "Content Studio",
        description: "Write in your voice, optimize for engagement, and schedule for maximum reach.",
      };

  const profile = await getXProfile(currentProject.id);
  const hasProfile = !!profile;

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page">
        <header className="page-header">
          <div>
            <p className="page-kicker">{copy.kicker}</p>
            <h1 className="page-title">{copy.title}</h1>
            <p className="page-copy">{copy.description}</p>
          </div>
        </header>
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 60px" }}>
          <AIWriterTab projectId={currentProject.id} hasProfile={hasProfile} />
        </main>
      </div>
    </DashboardShell>
  );
}

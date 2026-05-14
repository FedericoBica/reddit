import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
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
  const locale = await getLocale();
  const copy = locale.startsWith("es")
    ? {
        kicker: "X · Mi contexto",
        title: "Tu perfil de X",
        description: "Este contexto define todos los posts, sugerencias y respuestas generadas por IA.",
      }
    : locale.startsWith("pt")
    ? {
        kicker: "X · Meu contexto",
        title: "Seu perfil no X",
        description: "Este contexto molda todos os posts, sugestões e respostas gerados por IA.",
      }
    : {
        kicker: "X · My Context",
        title: "Your X Profile",
        description: "This context shapes all AI-generated posts, suggestions, and replies.",
      };

  const [profile, connectedAccount] = await Promise.all([
    getXProfile(currentProject.id),
    getConnectedAccount(currentProject.id),
  ]);

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

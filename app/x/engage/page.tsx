import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
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
  const locale = await getLocale();
  const copy = locale.startsWith("es")
    ? {
        kicker: "X · Interacción",
        title: "Interacción estratégica",
        description: "Descubrí dónde interactuar para lograr la mayor visibilidad. Respuestas pensadas para alcance, no solo para contestar.",
        comingSoon: "Próximamente",
        body: "Posts de alto valor para responder ahora mismo, sugerencias de respuesta para aumentar visibilidad y seguimiento de engagement a seguidores, todo en un solo feed.",
      }
    : locale.startsWith("pt")
    ? {
        kicker: "X · Engajar",
        title: "Engajamento estratégico",
        description: "Veja onde engajar para obter máxima visibilidade. Respostas desenhadas para alcance, não apenas para resposta.",
        comingSoon: "Em breve",
        body: "Posts de alto valor para responder agora, sugestões de resposta para aumentar visibilidade e acompanhamento de engajamento para seguidores, tudo em um único feed.",
      }
    : {
        kicker: "X · Engage",
        title: "Strategic Engagement",
        description: "See where to engage for maximum visibility. Replies designed for reach, not just response.",
        comingSoon: "Coming soon",
        body: "High-value posts to reply to right now, visibility-boosting reply suggestions, and engagement-to-follower tracking — all in one feed.",
      };

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
        <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>🎯</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1B", marginBottom: 8 }}>{copy.comingSoon}</p>
          <p style={{ fontSize: 14, color: "#7C7C83", maxWidth: 440, margin: "0 auto" }}>
            {copy.body}
          </p>
        </main>
      </div>
    </DashboardShell>
  );
}

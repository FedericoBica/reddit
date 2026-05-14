import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import { getXProfile } from "@/modules/x/context-actions";
import {
  listTodayInspirations,
  generateInspirationAction,
} from "@/modules/x/inspiration-actions";
import { INSPIRATION_ANGLES } from "@/modules/x/inspiration-config";
import { InspirationCards, GenerateButton } from "./inspiration-cards";

export const metadata: Metadata = { title: "Inspiration" };

export default async function XInspirationPage({
  searchParams,
}: {
  searchParams?: Promise<{ projectId?: string; filter?: string }>;
}) {
  const user = await requireUser("/x/inspiration");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);
  if (projectState.status === "missing") redirect("/bootstrap");
  const { currentProject } = projectState;
  const locale = await getLocale();
  const copy = locale.startsWith("es")
    ? {
        kicker: "X · Inspiración",
        title: "Sugerencias de hoy",
        description: "Posts escritos con tu voz, listos para ajustar y publicar.",
        refresh: "Actualizar ideas",
        all: "Todos",
        setupTitle: "Primero configurá tu contexto de X",
        setupBody: "La IA genera posts con tu voz usando tus intereses, tu estilo y tus reglas. Completá tu perfil de contexto para empezar.",
        setupCta: "Configurar mi contexto →",
        generateTitle: "Generá las ideas de hoy",
        generateBody: "5 posts en 5 estilos distintos: Insight, Historia, Hot Take, Pregunta y Producto, todos escritos con tu voz.",
        generate: "Generar ideas",
        emptyFilterTitle: "No hay posts para este filtro",
        emptyFilterBody: "Probá otra categoría o actualizá las ideas para generar una tanda nueva.",
      }
    : locale.startsWith("pt")
    ? {
        kicker: "X · Inspiração",
        title: "Sugestões de hoje",
        description: "Posts escritos com a sua voz, prontos para ajustar e publicar.",
        refresh: "Atualizar ideias",
        all: "Todos",
        setupTitle: "Configure primeiro seu contexto do X",
        setupBody: "A IA gera posts com a sua voz usando seus interesses, estilo de escrita e regras. Preencha seu perfil de contexto para começar.",
        setupCta: "Configurar meu contexto →",
        generateTitle: "Gere as ideias de hoje",
        generateBody: "5 posts em 5 estilos diferentes: Insight, História, Hot Take, Pergunta e Produto, todos escritos com a sua voz.",
        generate: "Gerar ideias",
        emptyFilterTitle: "Não há posts para este filtro",
        emptyFilterBody: "Tente outra categoria ou atualize as ideias para gerar um novo lote.",
      }
    : {
        kicker: "X · Inspiration",
        title: "Today's Suggestions",
        description: "Posts written in your voice — ready to tweak and send.",
        refresh: "Refresh ideas",
        all: "All",
        setupTitle: "Set up your X Context first",
        setupBody: "The AI generates posts in your voice using your interests, writing style, and rules. Fill in your context profile to get started.",
        setupCta: "Set up My Context →",
        generateTitle: "Generate today's post ideas",
        generateBody: "5 posts in 5 different styles — Insight, Story, Hot Take, Question, Product — all written in your voice.",
        generate: "Generate ideas",
        emptyFilterTitle: "No posts for this filter",
        emptyFilterBody: "Try a different category or refresh ideas to generate a new batch.",
      };

  const [profile, suggestions] = await Promise.all([
    getXProfile(currentProject.id),
    listTodayInspirations(currentProject.id),
  ]);

  const activeFilter = params?.filter ?? "all";
  const filteredSuggestions =
    activeFilter === "all"
      ? suggestions
      : suggestions.filter((s) => s.category === activeFilter);

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page">
        <header className="page-header">
          <div>
            <p className="page-kicker">{copy.kicker}</p>
            <h1 className="page-title">{copy.title}</h1>
            <p className="page-copy">
              {copy.description}
            </p>
          </div>
          {suggestions.length > 0 && (
            <GenerateButton
              projectId={currentProject.id}
              label={copy.refresh}
              action={generateInspirationAction}
            />
          )}
        </header>

        <main style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 60px" }}>
          {/* ── Filter pills ── */}
          {suggestions.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
              <a
                href={`/x/inspiration?projectId=${currentProject.id}`}
                className={`filter-pill${activeFilter === "all" ? " filter-pill-active" : ""}`}
              >
                {copy.all} ({suggestions.length})
              </a>
              {INSPIRATION_ANGLES.map((a) => {
                const count = suggestions.filter((s) => s.category === a.id).length;
                if (count === 0) return null;
                return (
                  <a
                    key={a.id}
                    href={`/x/inspiration?projectId=${currentProject.id}&filter=${a.id}`}
                    className={`filter-pill${activeFilter === a.id ? " filter-pill-active" : ""}`}
                  >
                    {a.label}
                  </a>
                );
              })}
            </div>
          )}

          {/* ── No profile state ── */}
          {!profile && (
            <EmptyState
              icon="✍️"
              title={copy.setupTitle}
              body={copy.setupBody}
              cta={{ label: copy.setupCta, href: "/x/context" }}
            />
          )}

          {/* ── Has profile, no suggestions yet ── */}
          {profile && suggestions.length === 0 && (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <p style={{ fontSize: 40, marginBottom: 16 }}>✨</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1B", marginBottom: 8 }}>
                {copy.generateTitle}
              </p>
              <p style={{ fontSize: 14, color: "#7C7C83", maxWidth: 440, margin: "0 auto 24px" }}>
                {copy.generateBody}
              </p>
              <GenerateButton
                projectId={currentProject.id}
                label={copy.generate}
                action={generateInspirationAction}
                primary
              />
            </div>
          )}

          {/* ── Suggestions list ── */}
          {filteredSuggestions.length > 0 && (
            <InspirationCards
              suggestions={filteredSuggestions}
              projectId={currentProject.id}
            />
          )}

          {/* ── Filter has no results ── */}
          {profile && suggestions.length > 0 && filteredSuggestions.length === 0 && (
            <EmptyState
              icon="🔍"
              title={copy.emptyFilterTitle}
              body={copy.emptyFilterBody}
            />
          )}
        </main>
      </div>
    </DashboardShell>
  );
}

function EmptyState({
  icon,
  title,
  body,
  cta,
}: {
  icon: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div style={{ padding: "48px 0", textAlign: "center" }}>
      <p style={{ fontSize: 40, marginBottom: 16 }}>{icon}</p>
      <p style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1B", marginBottom: 8 }}>{title}</p>
      <p style={{ fontSize: 14, color: "#7C7C83", maxWidth: 440, margin: "0 auto 20px" }}>{body}</p>
      {cta && (
        <a
          href={cta.href}
          style={{
            display: "inline-block",
            padding: "9px 20px",
            borderRadius: 8,
            background: "#FF4500",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          {cta.label}
        </a>
      )}
    </div>
  );
}

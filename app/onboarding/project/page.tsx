import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo, Wordmark } from "@/app/components/logo";
import {
  listProjectKeywordSuggestions,
  listProjectSubredditSuggestions,
} from "@/db/queries/projects";
import { requireUser } from "@/modules/auth/server";
import {
  completeProjectOnboarding,
  retryInitialProjectSuggestions,
} from "@/modules/projects/onboarding-actions";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = {
  title: "Onboarding",
};

type OnboardingPageProps = {
  searchParams?: Promise<{
    projectId?: string;
  }>;
};

export default async function ProjectOnboardingPage({ searchParams }: OnboardingPageProps) {
  await requireUser("/onboarding/project");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") {
    redirect("/bootstrap");
  }

  const project = projectState.currentProject;

  if (project.onboarding_status === "completed") {
    redirect(`/dashboard?projectId=${project.id}`);
  }

  const [keywords, subreddits] = await Promise.all([
    listProjectKeywordSuggestions(project.id),
    listProjectSubredditSuggestions(project.id),
  ]);

  const isGenerating = project.onboarding_status === "suggestions_pending";
  const canReview = keywords.length > 0 || subreddits.length > 0;

  return (
    <main className="app-page" style={{ minHeight: "100vh" }}>
      <header
        style={{
          minHeight: 72,
          padding: "18px 28px",
          borderBottom: "1px solid #F0F0EE",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(250,250,248,0.88)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={28} />
          <Wordmark size={18} />
        </div>
        <span className="badge" style={{ background: "#FFF3E8", color: "#E07000" }}>
          {project.name}
        </span>
      </header>

      <section className="page-header" style={{ borderBottom: 0, paddingBottom: 8 }}>
        <div>
          <p className="page-kicker">Onboarding</p>
          <h1 className="page-title">Elegí dónde vamos a buscar leads</h1>
          <p className="page-copy">
            Confirmá las sugerencias y agregá señales manuales. Esto define qué
            conversaciones monitorea ReddProwl para {project.name}.
          </p>
        </div>
        <StepBadge status={project.onboarding_status} />
      </section>

      <div className="content-flow" style={{ maxWidth: 1180, margin: "0 auto" }}>
        {isGenerating && (
          <div className="panel panel-pad" style={{ marginBottom: 18 }}>
            <p className="section-title">Estamos generando sugerencias</p>
            <p className="section-copy" style={{ marginTop: 8 }}>
              Podés refrescar en unos segundos. Si preferís avanzar ahora,
              completá keywords y subreddits manualmente abajo.
            </p>
          </div>
        )}

        {(project.onboarding_status === "needs_suggestions" ||
          project.onboarding_status === "suggestions_failed") && (
          <div
            className="panel panel-pad"
            style={{
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
            }}
          >
            <div>
              <p className="section-title">
                {project.onboarding_status === "suggestions_failed"
                  ? "No pudimos generar sugerencias"
                  : "Generá sugerencias con IA"}
              </p>
              <p className="section-copy" style={{ marginTop: 8 }}>
                {project.suggestions_error ??
                  "Analizamos tu producto para proponer keywords y subreddits iniciales."}
              </p>
            </div>
            <form action={retryInitialProjectSuggestions}>
              <input type="hidden" name="projectId" value={project.id} />
              <button className="button button-primary" type="submit">
                Generar sugerencias
              </button>
            </form>
          </div>
        )}

        <form action={completeProjectOnboarding} style={{ display: "grid", gap: 20 }}>
          <input type="hidden" name="projectId" value={project.id} />

          <div className="suggestion-grid">
            <section className="panel panel-pad">
              <p className="section-title">Keywords sugeridas</p>
              <p className="section-copy" style={{ marginTop: 8 }}>
                Buscamos señales como dolor, comparación, intención de compra y
                alternativas a competidores.
              </p>

              <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                {keywords.length > 0 ? (
                  keywords.map((keyword) => (
                    <label className="suggestion-option" key={keyword.id}>
                      <input
                        type="checkbox"
                        name="keywordSuggestionIds"
                        value={keyword.id}
                        defaultChecked
                      />
                      <span>
                        <strong style={{ display: "block", fontSize: 14 }}>
                          {keyword.term}
                        </strong>
                        <span className="field-hint">
                          {keyword.intent_category} · {keyword.rationale}
                        </span>
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="section-copy" style={{ marginTop: 8 }}>
                    Todavía no hay sugerencias. Agregá keywords manuales para
                    avanzar.
                  </p>
                )}
              </div>
            </section>

            <section className="panel panel-pad">
              <p className="section-title">Subreddits sugeridos</p>
              <p className="section-copy" style={{ marginTop: 8 }}>
                Priorizá comunidades donde tu comprador pregunta, compara o
                pide recomendaciones.
              </p>

              <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
                {subreddits.length > 0 ? (
                  subreddits.map((subreddit) => (
                    <label className="suggestion-option" key={subreddit.id}>
                      <input
                        type="checkbox"
                        name="subredditSuggestionIds"
                        value={subreddit.id}
                        defaultChecked
                      />
                      <span>
                        <strong style={{ display: "block", fontSize: 14 }}>
                          r/{subreddit.name}
                        </strong>
                        <span className="field-hint">
                          {subreddit.is_regional ? "Regional" : "Global"} ·{" "}
                          {subreddit.rationale}
                        </span>
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="section-copy" style={{ marginTop: 8 }}>
                    Todavía no hay sugerencias. Agregá subreddits manuales para
                    avanzar.
                  </p>
                )}
              </div>
            </section>
          </div>

          <section className="panel panel-pad">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 18,
              }}
            >
              <label className="field-group">
                <span className="field-label">Keywords manuales</span>
                <textarea
                  className="textarea"
                  name="customKeywords"
                  placeholder={"best crm for startups\nhubspot alternative\nneed lead gen tool"}
                />
                <span className="field-hint">Una por línea o separadas por coma.</span>
              </label>

              <label className="field-group">
                <span className="field-label">Subreddits manuales</span>
                <textarea
                  className="textarea"
                  name="customSubreddits"
                  placeholder={"SaaS\nstartups\ngrowthhacking"}
                />
                <span className="field-hint">Sin el prefijo r/.</span>
              </label>
            </div>
          </section>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <p className="section-copy">
              {canReview
                ? "Podés desmarcar sugerencias débiles antes de activar el proyecto."
                : "Necesitás al menos una keyword o subreddit manual si todavía no hay sugerencias."}
            </p>
            <button className="button button-primary" type="submit">
              Activar monitoreo
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function StepBadge({ status }: { status: string }) {
  const labelByStatus: Record<string, string> = {
    needs_suggestions: "Sugerencias pendientes",
    suggestions_pending: "Generando",
    suggestions_ready: "Listo para revisar",
    suggestions_failed: "Reintentar",
    completed: "Completado",
  };

  return (
    <span className="badge" style={{ background: "#FFFFFF", color: "#6B6B6E", border: "1px solid #F0F0EE" }}>
      {labelByStatus[status] ?? status}
    </span>
  );
}

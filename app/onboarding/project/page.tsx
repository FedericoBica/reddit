import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Logo, Wordmark } from "@/app/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
    redirect("/signup/company");
  }

  const project = projectState.currentProject;

  if (project.onboarding_status === "completed") {
    redirect(`/dashboard?projectId=${project.id}`);
  }

  const [keywords, subreddits, t] = await Promise.all([
    listProjectKeywordSuggestions(project.id),
    listProjectSubredditSuggestions(project.id),
    getTranslations("onboarding"),
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
        <Badge variant="secondary" className="rounded-[7px] bg-[#FFF3E8] font-extrabold text-[#E07000]">
          {project.name}
        </Badge>
      </header>

      <section className="page-header" style={{ borderBottom: 0, paddingBottom: 8 }}>
        <div>
          <p className="page-kicker">Onboarding</p>
          <h1 className="page-title">{t("reviewTitle")}</h1>
          <p className="page-copy">
            {t("pending")}
          </p>
        </div>
        <StepBadge status={project.onboarding_status} />
      </section>

      <div className="content-flow" style={{ maxWidth: 1180, margin: "0 auto" }}>
        {isGenerating && (
          <Card className="mb-[18px] gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
            <CardContent className="p-5">
              <p className="section-title">{t("generating")}</p>
              <p className="section-copy" style={{ marginTop: 8 }}>
                {t("pending")}
              </p>
            </CardContent>
          </Card>
        )}

        {(project.onboarding_status === "needs_suggestions" ||
          project.onboarding_status === "suggestions_failed") && (
          <Card className="mb-[18px] gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
            <CardContent
              className="flex items-center justify-between gap-[18px] p-5"
              style={{ flexWrap: "wrap" }}
            >
              <div>
                <p className="section-title">
                  {project.onboarding_status === "suggestions_failed"
                    ? t("failed")
                    : t("generating")}
                </p>
                <p className="section-copy" style={{ marginTop: 8 }}>
                  {project.suggestions_error ?? t("pending")}
                </p>
              </div>
              <form action={retryInitialProjectSuggestions}>
                <input type="hidden" name="projectId" value={project.id} />
                <Button className="h-10 rounded-[8px] font-extrabold" type="submit">
                  {t("retry")}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <form action={completeProjectOnboarding} style={{ display: "grid", gap: 20 }}>
          <input type="hidden" name="projectId" value={project.id} />

          <div className="suggestion-grid">
            <Card className="gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
              <CardContent className="p-5">
                <p className="section-title">{t("keywords")}</p>
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
              </CardContent>
            </Card>

            <Card className="gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
              <CardContent className="p-5">
                <p className="section-title">{t("subreddits")}</p>
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
              </CardContent>
            </Card>
          </div>

          <Card className="gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
            <CardContent className="p-5">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 18,
                }}
              >
                <label className="field-group">
                  <span className="field-label">{t("addCustomKeyword")}</span>
                  <Textarea
                    className="min-h-[112px] rounded-[8px] bg-white px-3 py-3 text-sm"
                    name="customKeywords"
                    placeholder={"best crm for startups\nhubspot alternative\nneed lead gen tool"}
                  />
                  <span className="field-hint">One per line or comma-separated.</span>
                </label>

                <label className="field-group">
                  <span className="field-label">{t("addCustomSubreddit")}</span>
                  <Textarea
                    className="min-h-[112px] rounded-[8px] bg-white px-3 py-3 text-sm"
                    name="customSubreddits"
                    placeholder={"SaaS\nstartups\ngrowthhacking"}
                  />
                  <span className="field-hint">Without the r/ prefix.</span>
                </label>
              </div>
            </CardContent>
          </Card>

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
            <Button className="h-10 rounded-[8px] font-extrabold" type="submit">
              {t("startScraping")}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

function StepBadge({ status }: { status: string }) {
  const labelByStatus: Record<string, string> = {
    needs_suggestions: "Pending",
    suggestions_pending: "Generating…",
    suggestions_ready: "Ready to review",
    suggestions_failed: "Retry",
    completed: "Completed",
  };

  return (
    <Badge variant="outline" className="rounded-[7px] bg-white font-extrabold text-[#6B6B6E]">
      {labelByStatus[status] ?? status}
    </Badge>
  );
}

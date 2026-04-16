import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  canCreateProject,
  formatProjectUsage,
} from "@/modules/billing/limits";
import { getCurrentBillingPlan } from "@/modules/billing/current";
import { requireUser } from "@/modules/auth/server";
import { createAdditionalProject } from "@/modules/projects/actions";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = {
  title: "Nuevo proyecto",
};

type NewProjectPageProps = {
  searchParams?: Promise<{ projectId?: string; error?: string }>;
};

export default async function NewProjectPage({ searchParams }: NewProjectPageProps) {
  const user = await requireUser("/projects/new");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") {
    redirect("/bootstrap");
  }

  const { currentProject, projects } = projectState;
  const limit = await getCurrentBillingPlan();
  const canCreate = canCreateProject(projects.length, limit);

  return (
    <DashboardShell
      user={user}
      projects={projects}
      currentProject={currentProject}
      newLeadsCount={0}
    >
      <main className="app-page" style={{ minHeight: "100vh" }}>
        <header className="page-header">
          <div>
            <Link
              href={`/dashboard?projectId=${currentProject.id}`}
              style={{
                display: "inline-flex",
                color: "#E07000",
                fontSize: 13,
                fontWeight: 800,
                textDecoration: "none",
                marginBottom: 14,
              }}
            >
              Volver al Searchbox
            </Link>
            <p className="page-kicker">Nuevo proyecto</p>
            <h1 className="page-title">Crear otro Searchbox</h1>
            <p className="page-copy">
              Separá productos, segmentos o regiones en proyectos distintos.
              Cada proyecto tiene sus propias keywords, subreddits, leads y
              respuestas. Tu plan actual: {limit.label} ·{" "}
              {formatProjectUsage(projects.length, limit)}.
            </p>
          </div>
        </header>

        <section className="content-flow" style={{ maxWidth: 980, margin: "0 auto" }}>
          <div className="new-project-layout">
            <Card className="gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
              <CardContent className="p-6">
                {params?.error && (
                  <Card className="mb-5 gap-0 rounded-[8px] border-[#FEE2E2] bg-[#FEF2F2] py-0 text-[#991B1B] shadow-none ring-0">
                    <CardContent className="p-4 text-sm leading-6">
                      {params.error}
                    </CardContent>
                  </Card>
                )}

                {canCreate ? (
                  <form action={createAdditionalProject} style={{ display: "grid", gap: 18 }}>
                    <label className="field-group">
                      <span className="field-label">Nombre del proyecto</span>
                      <Input
                        className="h-11 rounded-[8px] bg-white px-3 text-sm"
                        name="name"
                        placeholder="Producto, región o vertical"
                        required
                        maxLength={120}
                      />
                    </label>

                    <label className="field-group">
                      <span className="field-label">Sitio web</span>
                      <Input
                        className="h-11 rounded-[8px] bg-white px-3 text-sm"
                        name="websiteUrl"
                        type="url"
                        placeholder="https://tuproducto.com"
                      />
                      <span className="field-hint">
                        Opcional, pero mejora las sugerencias de keywords.
                      </span>
                    </label>

                    <label className="field-group">
                      <span className="field-label">Propuesta de valor</span>
                      <Textarea
                        className="min-h-[126px] rounded-[8px] bg-white px-3 py-3 text-sm"
                        name="valueProposition"
                        placeholder="Ayudamos a..."
                        maxLength={2000}
                      />
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <label className="field-group">
                        <span className="field-label">Región</span>
                        <Input
                          className="h-11 rounded-[8px] bg-white px-3 text-sm"
                          name="region"
                          placeholder="US, LATAM, global"
                        />
                      </label>
                      <label className="field-group">
                        <span className="field-label">Idioma</span>
                        <select className="select" name="primaryLanguage" defaultValue="en">
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="pt">Português</option>
                        </select>
                      </label>
                    </div>

                    <Button className="h-11 rounded-[8px] font-extrabold" type="submit">
                      Crear proyecto y configurar
                    </Button>
                  </form>
                ) : (
                  <div>
                    <p className="section-title">Límite de proyectos alcanzado</p>
                    <p className="section-copy" style={{ marginTop: 10 }}>
                      Tu plan {limit.label} permite hasta {limit.maxProjects} proyectos.
                      Para crear otro Searchbox necesitás cambiar de plan.
                    </p>
                    <Button asChild className="mt-5 h-10 rounded-[8px] font-extrabold">
                      <Link href={`/settings?projectId=${currentProject.id}`}>
                        Ver billing en Settings
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
              <CardContent className="p-5">
                <p className="section-title">Después de crear</p>
                <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
                  {[
                    ["01", "Elegís keywords y subreddits propios"],
                    ["02", "El proyecto queda seleccionado automáticamente"],
                    ["03", "El dashboard filtra leads por ese proyecto"],
                  ].map(([step, text]) => (
                    <div key={step} style={{ display: "flex", gap: 12 }}>
                      <span
                        style={{
                          color: "#E07000",
                          fontSize: 20,
                          fontWeight: 900,
                          letterSpacing: "-0.04em",
                          minWidth: 32,
                        }}
                      >
                        {step}
                      </span>
                      <span style={{ fontSize: 13, color: "#6B6B6E", lineHeight: 1.5 }}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </DashboardShell>
  );
}

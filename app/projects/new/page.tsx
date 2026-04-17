import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BrandLink } from "@/app/components/logo";
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
  title: "New project",
};

type NewProjectPageProps = {
  searchParams?: Promise<{ projectId?: string; error?: string }>;
};

export default async function NewProjectPage({ searchParams }: NewProjectPageProps) {
  await requireUser("/projects/new");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") {
    redirect("/bootstrap");
  }

  const { currentProject, projects } = projectState;
  const [limit, t] = await Promise.all([
    getCurrentBillingPlan(),
    getTranslations("newProject"),
  ]);
  const tCommon = await getTranslations("common");
  const tPlan = await getTranslations("plan");
  const canCreate = canCreateProject(projects.length, limit);

  const steps = t.raw("steps") as string[];

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <BrandLink logoSize={30} wordmarkSize={20} />

        <div style={{ maxWidth: 700 }}>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1
            style={{
              fontSize: "clamp(40px, 7vw, 72px)",
              lineHeight: 0.98,
              letterSpacing: "-0.055em",
              fontWeight: 900,
              marginTop: 24,
            }}
          >
            {t("headline")}
          </h1>
          <p className="page-copy" style={{ fontSize: 18, marginTop: 24 }}>
            {t("description")}
          </p>
        </div>

        <Card className="max-w-[640px] gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
          <CardContent className="p-5">
            <p className="section-title">{t("whatHappensNext")}</p>
            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              {steps.map((text, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <span
                    style={{
                      color: "#E07000",
                      fontSize: 22,
                      fontWeight: 900,
                      letterSpacing: "-0.04em",
                      minWidth: 38,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 14, color: "#6B6B6E", lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="auth-panel">
        <div style={{ maxWidth: 430, width: "100%", margin: "0 auto" }}>
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
            {tCommon("backToDashboard")}
          </Link>

          <p className="page-kicker">{t("kicker")}</p>
          <h2 className="page-title" style={{ fontSize: 38 }}>
            {t("title")}
          </h2>
          <p className="page-copy">
            {t("planUsage")}: {limit.label} · {formatProjectUsage(projects.length, limit)}.
          </p>

          {params?.error && (
            <Card className="mt-4 gap-0 rounded-[8px] border-[#FEE2E2] bg-[#FEF2F2] py-0 text-[#991B1B] shadow-none ring-0">
              <CardContent className="p-4 text-sm leading-6">
                {params.error}
              </CardContent>
            </Card>
          )}

          {canCreate ? (
            <form action={createAdditionalProject} style={{ display: "grid", gap: 18, marginTop: 28 }}>
              <label className="field-group">
                <span className="field-label">Project name</span>
                <Input
                  className="h-11 rounded-[8px] bg-white px-3 text-sm"
                  name="name"
                  placeholder={t("form.namePlaceholder")}
                  required
                  maxLength={120}
                />
              </label>

              <label className="field-group">
                <span className="field-label">Website</span>
                <Input
                  className="h-11 rounded-[8px] bg-white px-3 text-sm"
                  name="websiteUrl"
                  type="url"
                  placeholder="https://yourproduct.com"
                />
                <span className="field-hint">
                  {t("form.websiteHint")}
                </span>
              </label>

              <label className="field-group">
                <span className="field-label">Value proposition</span>
                <Textarea
                  className="min-h-[112px] rounded-[8px] bg-white px-3 py-3 text-sm"
                  name="valueProposition"
                  placeholder={t("form.valuePropositionPlaceholder")}
                  maxLength={2000}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label className="field-group">
                  <span className="field-label">Region</span>
                  <Input
                    className="h-11 rounded-[8px] bg-white px-3 text-sm"
                    name="region"
                    placeholder={t("form.regionPlaceholder")}
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">Language</span>
                  <select className="select" name="primaryLanguage" defaultValue="en">
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="pt">Português</option>
                  </select>
                </label>
              </div>

              <Button className="h-11 rounded-[8px] font-extrabold" type="submit">
                {t("form.submit")}
              </Button>
            </form>
          ) : (
            <div style={{ marginTop: 28 }}>
              <p className="section-title">{t("limitTitle")}</p>
              <p className="section-copy" style={{ marginTop: 10 }}>
                {t("limitDescription", { plan: limit.label, max: limit.maxProjects ?? "∞" })}
              </p>
              <Button asChild className="mt-5 h-10 rounded-[8px] font-extrabold">
                <Link href={`/settings?projectId=${currentProject.id}`}>
                  {tCommon("viewBilling")}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BrandLink } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { canCreateProject, formatProjectUsage } from "@/modules/billing/limits";
import { getCurrentBillingPlan } from "@/modules/billing/current";
import { requireUser } from "@/modules/auth/server";
import {
  analyzeNewProjectWebsite,
  createAdditionalProjectFromProfile,
  resetNewProjectAnalysis,
} from "@/modules/projects/actions";
import { resolveCurrentProject } from "@/modules/projects/current";
import { NewProjectAnalyzeButton, NewProjectSubmitButton } from "./new-project-buttons";

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
  const [limit, tCommon] = await Promise.all([
    getCurrentBillingPlan(),
    getTranslations("common"),
  ]);

  const canCreate = canCreateProject(projects.length, limit);

  const cookieStore = await cookies();
  const website = decodeCookieValue(cookieStore.get("new_project_website")?.value);
  const description = decodeCookieValue(cookieStore.get("new_project_description")?.value);
  const analyzed = Boolean(website && description);

  return (
    <main className="signup-wizard-shell">
      <header className="signup-wizard-brand">
        <BrandLink logoSize={28} wordmarkSize={18} />
      </header>

      <Card className="signup-wizard-card">
        <CardContent className="signup-wizard-content p-0">
          {!canCreate ? (
            <LimitReached
              currentProjectId={currentProject.id}
              label={limit.label}
              max={limit.maxProjects}
              projectCount={projects.length}
              tCommon={tCommon}
            />
          ) : !analyzed ? (
            <AnalyzeStep error={params?.error} currentProjectId={currentProject.id} tCommon={tCommon} />
          ) : (
            <ReviewStep
              website={website}
              description={description}
              error={params?.error}
              currentProjectId={currentProject.id}
              tCommon={tCommon}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function AnalyzeStep({
  error,
  currentProjectId,
  tCommon,
}: {
  error?: string;
  currentProjectId: string;
  tCommon: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <>
      <section className="signup-wizard-main">
        <p className="page-kicker">New project</p>
        <h1 className="signup-wizard-title">Tell us about your product</h1>
        <p className="signup-wizard-copy">
          We&apos;ll analyze your website and generate a description to find buyer-intent posts on Reddit.
        </p>

        {error && <div className="signup-error">{error}</div>}

        <form action={analyzeNewProjectWebsite} className="signup-form">
          <label className="field-group">
            <span className="field-label">Company website</span>
            <Input
              className="h-11 rounded-[8px] bg-white px-3 text-sm"
              name="website"
              type="url"
              placeholder="https://yourproduct.com"
              required
            />
          </label>
          <NewProjectAnalyzeButton />
        </form>

        <Link
          href={`/dashboard?projectId=${currentProjectId}`}
          style={{
            display: "inline-flex",
            color: "#6B6B6E",
            fontSize: 13,
            textDecoration: "none",
            marginTop: 16,
          }}
        >
          ← {tCommon("backToDashboard")}
        </Link>
      </section>

      <aside className="signup-wizard-visual">
        <div className="signup-analysis-list signup-analysis-list-compact">
          {["Analyzing your website", "Generating company description", "Setting up Reddit keywords"].map((step) => (
            <div className="signup-analysis-step" key={step}>
              <span />
              <div>
                <strong>{step}</strong>
                <p>Ready</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

function ReviewStep({
  website,
  description,
  error,
  currentProjectId,
  tCommon,
}: {
  website: string;
  description: string;
  error?: string;
  currentProjectId: string;
  tCommon: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <>
      <section className="signup-wizard-main">
        <p className="page-kicker">New project</p>
        <h1 className="signup-wizard-title">Review your company description</h1>
        <p className="signup-wizard-copy">
          This description helps our AI find the right buyer-intent posts on Reddit. Edit it if needed.
        </p>

        {error && <div className="signup-error">{error}</div>}

        <form action={createAdditionalProjectFromProfile} className="signup-form">
          <input type="hidden" name="website" value={website} />
          <label className="field-group">
            <span className="field-label">Company description</span>
            <Textarea
              className="min-h-[132px] rounded-[8px] bg-white px-3 py-3 text-sm"
              name="description"
              defaultValue={description}
              maxLength={800}
              required
            />
            <span className="field-hint">
              Website: <strong style={{ color: "#1C1C1E" }}>{website}</strong>
            </span>
          </label>
          <NewProjectSubmitButton />
        </form>

        <form action={resetNewProjectAnalysis} style={{ marginTop: 12 }}>
          <button
            type="submit"
            style={{
              background: "none",
              border: "none",
              color: "#6B6B6E",
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ← Use a different website
          </button>
        </form>
      </section>

      <aside className="signup-wizard-visual">
        <div className="signup-analysis-list">
          <div className="signup-analysis-step">
            <span className="signup-analysis-dot-done" />
            <div>
              <strong>Website analyzed</strong>
              <p>Analysis complete.</p>
            </div>
          </div>
          <div className="signup-analysis-step">
            <span className="signup-analysis-dot-done" />
            <div>
              <strong>Description generated</strong>
              <p>Review and edit before continuing.</p>
            </div>
          </div>
          <div className="signup-analysis-step">
            <span />
            <div>
              <strong>Configure Reddit keywords</strong>
              <p>Next step after saving.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function LimitReached({
  currentProjectId,
  label,
  max,
  tCommon,
}: {
  currentProjectId: string;
  label: string;
  max: number | null;
  projectCount: number;
  tCommon: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <section className="signup-wizard-main" style={{ gridColumn: "1 / -1" }}>
      <p className="page-kicker">New project</p>
      <h1 className="signup-wizard-title">Project limit reached</h1>
      <p className="signup-wizard-copy">
        Your {label} plan allows up to {max ?? "∞"} projects. Upgrade to add more.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <Button asChild className="h-10 rounded-[8px] font-extrabold">
          <Link href={`/settings?projectId=${currentProjectId}`}>
            {tCommon("viewBilling")}
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-10 rounded-[8px]">
          <Link href={`/dashboard?projectId=${currentProjectId}`}>
            {tCommon("backToDashboard")}
          </Link>
        </Button>
      </div>
    </section>
  );
}

function decodeCookieValue(value?: string): string {
  if (!value) return "";
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(value)) {
    return isReadableText(value) ? sanitizeText(value) : "";
  }
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    return isReadableText(decoded) ? sanitizeText(decoded) : "";
  } catch {
    return isReadableText(value) ? sanitizeText(value) : "";
  }
}

function isReadableText(value: string) {
  if (!value.trim()) return false;
  const replacementChars = (value.match(/\uFFFD/g) ?? []).length;
  const controlChars = (value.match(/[\u0000-\u0008\u000E-\u001F]/g) ?? []).length;
  return replacementChars === 0 && controlChars === 0;
}

function sanitizeText(value: string) {
  return value.replace(/[\u0000-\u0008\u000E-\u001F]/g, "").trim();
}

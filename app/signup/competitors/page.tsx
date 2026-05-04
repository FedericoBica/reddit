import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BrandLink } from "@/app/components/logo";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/modules/auth/server";
import { isCurrentUserAdmin } from "@/modules/auth/admin";
import { saveCompetitorsFromSignup } from "@/modules/onboarding/signup-actions";
import { CompetitorsForm } from "./competitors-form";
import { SignupProgress } from "@/app/signup/components/signup-progress";

export const metadata: Metadata = {
  title: "Competidores",
};

type CompetitorsPageProps = {
  searchParams?: Promise<{ projectId?: string; error?: string; preview?: string }>;
};

export default async function SignupCompetitorsPage({ searchParams }: CompetitorsPageProps) {
  const t = await getTranslations("signup.competitors");
  const user = await getCurrentUser();
  const params = await searchParams;
  const projectId = params?.projectId ?? "";

  if (!user) redirect("/signup");
  if (!projectId) {
    if (params?.preview === "1" && await isCurrentUserAdmin()) {
      // Admin preview mode
    } else {
      redirect("/signup/company");
    }
  }

  return (
    <main className="signup-wizard-shell">
      <header className="signup-wizard-brand">
        <BrandLink logoSize={28} wordmarkSize={18} />
      </header>

      <div className="sw-progress-wrap">
        <SignupProgress active={1} />
      </div>

      <Card className="signup-wizard-card">
        <CardContent className="signup-wizard-content" style={{ padding: 0 }}>
          <section className="signup-wizard-main">
            <div className="sw-eyebrow">
              <span className="sw-eyebrow-dot" />
              {t("eyebrow")}
            </div>
            <h1 className="signup-wizard-title">
              {t("title1")}<br /><em>{t("titleEm")}</em>
            </h1>
            <p className="signup-wizard-copy">
              {t("description")}
            </p>

            {params?.error && <div className="signup-error">{params.error}</div>}

            <CompetitorsForm action={saveCompetitorsFromSignup} projectId={projectId} />
          </section>

          <aside className="signup-wizard-visual">
            <div className="sw-pane-eyebrow">
              <span style={{ color: "oklch(0.58 0.18 38)", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em" }}>{t("battlecards")}</span>
              <span className="sw-pane-meta">{t("generatedCount")}</span>
            </div>
            <p className="sw-pane-quote">{t.rich("quote", { em: (chunks) => <em>{chunks}</em> })}</p>
            <div className="sw-bc-list">
              <div className="sw-bc">
                <span className="sw-bc-score">94</span>
                <span className="sw-bc-sub">r/sales</span>
                <span className="sw-bc-q">{t("card1Title")}</span>
                <span className="sw-bc-meta">{t("card1Meta")}</span>
              </div>
              <div className="sw-bc">
                <span className="sw-bc-score">88</span>
                <span className="sw-bc-sub">r/saas</span>
                <span className="sw-bc-q">{t("card2Title")}</span>
                <span className="sw-bc-meta">{t("card2Meta")}</span>
              </div>
              <div className="sw-bc sw-bc-muted">
                <span className="sw-bc-score">71</span>
                <span className="sw-bc-sub">r/startups</span>
                <span className="sw-bc-q">{t("card3Title")}</span>
                <span className="sw-bc-meta">{t("card3Meta")}</span>
              </div>
            </div>
          </aside>
        </CardContent>
      </Card>
    </main>
  );
}

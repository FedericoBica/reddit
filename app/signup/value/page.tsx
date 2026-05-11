import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BrandLink } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/modules/auth/server";
import { isCurrentUserAdmin } from "@/modules/auth/admin";
import { getSignupProjectOrRedirect } from "@/modules/onboarding/signup-flow";
import { continueToPlan } from "@/modules/onboarding/signup-actions";
import { ValuePanel } from "./value-panel";
import { SignupProgress } from "@/app/signup/components/signup-progress";

export const metadata: Metadata = {
  title: "Cómo ayuda Prowlit",
};

type ValuePageProps = {
  searchParams?: Promise<{ projectId?: string; preview?: string }>;
};

export default async function SignupValuePage({ searchParams }: ValuePageProps) {
  const t = await getTranslations("signup.value");
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
  } else {
    await getSignupProjectOrRedirect(projectId);
  }

  return (
    <main className="signup-wizard-shell">
      <header className="signup-wizard-brand">
        <BrandLink logoSize={28} wordmarkSize={18} />
      </header>

      <div className="sw-progress-wrap">
        <SignupProgress active={2} />
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

            <ul className="sw-checklist">
              <ValueItem title={t("item1Title")} text={t("item1Text")} />
              <ValueItem title={t("item2Title")} text={t("item2Text")} />
              <ValueItem title={t("item3Title")} text={t("item3Text")} />
            </ul>

            <form action={continueToPlan}>
              <input type="hidden" name="projectId" value={projectId} />
              <Button
                className="sw-btn-primary w-full"
                type="submit"
              >
                {t("continue")}
              </Button>
            </form>
          </section>

          <aside className="signup-wizard-visual">
            <div className="sw-pane-eyebrow">
              <span className="sw-live-tag">
                <span className="sw-pulse" />
                {t("liveRadar")}
              </span>
              <span className="sw-pane-meta">{t("threadsToday")}</span>
            </div>
            <ValuePanel />
          </aside>
        </CardContent>
      </Card>
    </main>
  );
}

function ValueItem({ title, text }: { title: string; text: string }) {
  return (
    <li>
      <span className="sw-ch-icon">✓</span>
      <div>
        <div className="sw-ch-title">{title}</div>
        <div className="sw-ch-desc">{text}</div>
      </div>
    </li>
  );
}

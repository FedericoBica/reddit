import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BrandLink } from "@/app/components/logo";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/modules/auth/server";
import { isCurrentUserAdmin } from "@/modules/auth/admin";
import { LoadingProgress } from "./loading-progress";

export const metadata: Metadata = {
  title: "Preparando Prowlit",
};

type LoadingPageProps = {
  searchParams?: Promise<{ projectId?: string; preview?: string }>;
};

export default async function SignupLoadingPage({ searchParams }: LoadingPageProps) {
  const t = await getTranslations("signup.loading");
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
    <main className="signup-wizard-shell signup-tutorial-backdrop">
      <header className="signup-wizard-brand">
        <BrandLink logoSize={28} wordmarkSize={18} />
      </header>

      <Card className="signup-loading-card">
        <div className="signup-loading-solo">
          <div className="signup-loader" />
          <div className="sw-eyebrow">
            <span className="sw-eyebrow-dot" />
            {t("eyebrow")}
          </div>
          <h1 className="signup-wizard-title" style={{ fontSize: 34, marginTop: 8 }}>
            {t("title1")}<br />{t("title2")} <em>{t("titleEm")}</em>
          </h1>
          <p className="signup-wizard-copy">
            {t("description")}
          </p>
          <LoadingProgress projectId={projectId} />
        </div>
      </Card>
    </main>
  );
}

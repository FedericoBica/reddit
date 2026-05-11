import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BrandLink } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resolvePostAuthPath } from "@/modules/auth/post-auth";
import { getCurrentUser } from "@/modules/auth/server";
import {
  signUpWithGoogle,
  signUpWithPassword,
} from "@/modules/onboarding/signup-actions";
import { SignupProgress } from "./components/signup-progress";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

type SignUpPageProps = {
  searchParams?: Promise<{
    email?: string;
    error?: string;
    notice?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const t = await getTranslations("signup.start");
  const user = await getCurrentUser();
  const params = await searchParams;
  const email = String(params?.email ?? "").trim().toLowerCase();

  if (user) {
    redirect(await resolvePostAuthPath("/dashboard"));
  }

  return (
    <main className="signup-wizard-shell">
      <header className="signup-wizard-brand">
        <BrandLink logoSize={28} wordmarkSize={18} />
        <div className="signup-topbar-right">
          <a href="/login" className="signup-topbar-help">{t("alreadyHaveAccount")}</a>
        </div>
      </header>

      <div className="sw-progress-wrap">
        <SignupProgress active={-1} />
      </div>

      <Card className="signup-wizard-card">
        <CardContent className="signup-wizard-content" style={{ padding: 0 }}>
          <section className="signup-wizard-main">
            <div className="sw-eyebrow">
              <span className="sw-eyebrow-dot" />
              {t("eyebrow")}
            </div>
            <h1 className="signup-wizard-title" id="signup-title">
              {t("title1")}<br /><em>{t("titleEm")}</em>
            </h1>
            <p className="signup-wizard-copy" id="signup-description">
              {t("description")}
            </p>

            {params?.error && (
              <div
                aria-live="assertive"
                className="signup-error"
                id="signup-error"
                role="alert"
              >
                {params.error}
              </div>
            )}

            {params?.notice && (
              <div aria-live="polite" className="signup-notice" role="status">
                {params.notice}
              </div>
            )}

            <form action={signUpWithGoogle}>
              <button className="login-btn-google" type="submit">
                <GoogleIcon />
                {t("google")}
              </button>
            </form>

            <div className="signup-auth-divider">{t("divider")}</div>

            <form
              action={signUpWithPassword}
              aria-describedby={params?.error ? "signup-error" : undefined}
              aria-labelledby="signup-title"
              className="signup-form"
            >
              <label className="field-group" htmlFor="signup-email">
                <span className="field-label">{t("emailLabel")}</span>
                <Input
                  aria-invalid={Boolean(params?.error)}
                  className="h-11 rounded-[10px] bg-white px-3 text-sm"
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  defaultValue={email}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="field-group" htmlFor="signup-password">
                <span className="field-label">{t("passwordLabel")}</span>
                <Input
                  className="h-11 rounded-[10px] bg-white px-3 text-sm"
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <Button className="sw-btn-primary w-full" type="submit">
                {t("submit")}
              </Button>
            </form>
          </section>

          <aside className="signup-wizard-visual">
            <div className="sw-pane-eyebrow">
              <span className="sw-live-tag">
                <span className="sw-pulse" />
                {t("liveLeads")}
              </span>
              <span className="sw-pane-meta">{t("today")}</span>
            </div>
            <div className="sw-radar-feed">
              <FloatingLead title={t("lead1")} score="94" fresh />
              <FloatingLead title={t("lead2")} score="88" />
              <FloatingLead title={t("lead3")} score="81" dim />
            </div>
            <div className="sw-divider" style={{ marginTop: 16 }} />
            <p style={{ fontSize: 12, color: "oklch(0.6 0.02 55)", fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.04em" }}>
              {t("tip")}
            </p>
          </aside>
        </CardContent>
      </Card>
    </main>
  );
}

function FloatingLead({ title, score, fresh, dim }: { title: string; score: string; fresh?: boolean; dim?: boolean }) {
  return (
    <div
      className={`sw-radar-row${fresh ? " sw-radar-row-fresh" : ""}${dim ? " sw-radar-row-muted" : ""}`}
    >
      <div>
        <div className="sw-radar-post">{title}</div>
      </div>
      <div className="sw-radar-score">{score}</div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" width="17" height="17" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

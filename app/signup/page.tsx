import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/modules/auth/server";
import { signUpWithPassword } from "@/modules/onboarding/signup-actions";
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
  const user = await getCurrentUser();
  const params = await searchParams;
  const email = String(params?.email ?? "").trim().toLowerCase();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="signup-wizard-shell">
      <header className="signup-wizard-brand">
        <BrandLink logoSize={28} wordmarkSize={18} />
        <div className="signup-topbar-right">
          <a href="/login" className="signup-topbar-help">Already have an account?</a>
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
              Start here
            </div>
            <h1 className="signup-wizard-title" id="signup-title">
              Unlock Reddit&apos;s<br /><em>hidden buyers.</em>
            </h1>
            <p className="signup-wizard-copy" id="signup-description">
              Join businesses finding high-quality leads from Reddit in minutes. No credit card required.
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

            <form
              action={signUpWithPassword}
              aria-describedby={params?.error ? "signup-error" : undefined}
              aria-labelledby="signup-title"
              className="signup-form"
            >
              <label className="field-group" htmlFor="signup-email">
                <span className="field-label">Email</span>
                <Input
                  aria-invalid={Boolean(params?.error)}
                  className="h-11 rounded-[10px] bg-white px-3 text-sm"
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  defaultValue={email}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="field-group" htmlFor="signup-password">
                <span className="field-label">Password</span>
                <Input
                  className="h-11 rounded-[10px] bg-white px-3 text-sm"
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <Button className="sw-btn-primary w-full" type="submit">
                Create account →
              </Button>
            </form>
          </section>

          <aside className="signup-wizard-visual">
            <div className="sw-pane-eyebrow">
              <span className="sw-live-tag">
                <span className="sw-pulse" />
                Live leads
              </span>
              <span className="sw-pane-meta">Today</span>
            </div>
            <div className="sw-radar-feed">
              <FloatingLead title="Best CRM for a bootstrapped SaaS?" score="94" fresh />
              <FloatingLead title="Looking for a lightweight Intercom alternative" score="88" />
              <FloatingLead title="Agency tools for social lead monitoring" score="81" dim />
            </div>
            <div className="sw-divider" style={{ marginTop: 16 }} />
            <p style={{ fontSize: 12, color: "oklch(0.6 0.02 55)", fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.04em" }}>
              Tip — works best for B2B SaaS, agencies, and dev tools.
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

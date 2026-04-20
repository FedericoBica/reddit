import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/modules/auth/server";
import { signUpWithPassword } from "@/modules/onboarding/signup-actions";

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
      </header>

      <Card className="signup-wizard-card">
        <CardContent className="signup-wizard-content">
          <section className="signup-wizard-main">
            <StepDots active={0} total={5} />
            <p className="page-kicker">Signup</p>
            <h1 className="signup-wizard-title" id="signup-title">
              Unlock Reddit&apos;s hidden customer goldmine
            </h1>
            <p className="signup-wizard-copy" id="signup-description">
              Join businesses finding high-quality leads from Reddit in minutes.
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
                  className="h-11 rounded-[8px] bg-white px-3 text-sm"
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
                  className="h-11 rounded-[8px] bg-white px-3 text-sm"
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <Button className="h-11 rounded-[8px] font-extrabold" type="submit">
                Next
              </Button>
            </form>

            <p className="section-copy" style={{ marginTop: 18 }}>
              ¿Ya tenés cuenta?{" "}
              <a href="/login" style={{ color: "#E07000", fontWeight: 800, textDecoration: "none" }}>
                Entrar
              </a>
            </p>
          </section>

          <aside className="signup-wizard-visual">
            <FloatingLead title="Best project management tool?" score="98" />
            <FloatingLead title="Looking for a CRM alternative" score="91" />
            <FloatingLead title="Agency tools for social leads" score="87" />
          </aside>
        </CardContent>
      </Card>
    </main>
  );
}

function StepDots({ active, total }: { active: number; total: number }) {
  return (
    <div className="signup-step-dots" aria-label={`Step ${active + 1} of ${total}`} role="status">
      {Array.from({ length: total }).map((_, index) => (
        <span
          aria-hidden="true"
          key={index}
          className={index === active ? "signup-step-dot-active" : ""}
        />
      ))}
    </div>
  );
}

function FloatingLead({ title, score }: { title: string; score: string }) {
  return (
    <div className="signup-floating-lead">
      <span>{title}</span>
      <strong>{score}</strong>
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/modules/auth/server";
import {
  requestSignUpCode,
  verifySignUpCode,
} from "@/modules/auth/actions";
import { signUpWithGoogle } from "@/modules/onboarding/signup-actions";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

type SignUpPageProps = {
  searchParams?: Promise<{
    email?: string;
    error?: string;
    sent?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const email = String(params?.email ?? "").trim().toLowerCase();
  const isCodeStep = params?.sent === "1" && email.length > 0;

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
              {isCodeStep ? "Ingresá el código" : "Unlock Reddit's hidden customer goldmine"}
            </h1>
            <p className="signup-wizard-copy" id="signup-description">
              {isCodeStep
                ? `Te enviamos un código de 6 dígitos a ${email}.`
                : "Join businesses finding high-quality leads from Reddit in minutes."}
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

            {isCodeStep ? (
              <form action={verifySignUpCode} className="signup-form">
                <input type="hidden" name="email" value={email} />
                <label className="field-group" htmlFor="signup-code">
                  <span className="field-label">Código de acceso</span>
                  <Input
                    className="h-11 rounded-[8px] bg-white px-3 text-sm tracking-widest"
                    id="signup-code"
                    name="token"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    required
                  />
                  <span className="field-hint">
                    Revisá tu inbox (y spam). El código expira en 10 minutos.
                  </span>
                </label>
                <Button className="h-11 rounded-[8px] font-extrabold" type="submit">
                  Crear cuenta
                </Button>
                <p className="section-copy" style={{ marginTop: 10 }}>
                  <a
                    href={`/signup?email=${encodeURIComponent(email)}`}
                    style={{ color: "#E07000", fontWeight: 700, textDecoration: "none" }}
                  >
                    ← Cambiar email
                  </a>
                </p>
              </form>
            ) : (
              <>
                <form
                  action={signUpWithGoogle}
                  aria-describedby={params?.error ? "signup-error" : undefined}
                  className="signup-form"
                >
                  <Button
                    aria-label="Sign up with Google"
                    className="h-11 rounded-[8px] border-[#E5E5EA] bg-white font-extrabold text-[#1C1C1E] hover:bg-[#F7F7F5]"
                    type="submit"
                    variant="outline"
                  >
                    <GoogleIcon />
                    Sign up with Google
                  </Button>
                </form>

                <div className="signup-auth-divider">
                  <span>or use email</span>
                </div>

                <form
                  action={requestSignUpCode}
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
                  <Button className="h-11 rounded-[8px] font-extrabold" type="submit">
                    Send code
                  </Button>
                  <span className="field-hint">
                    Te enviamos un código de 6 dígitos. No necesitás contraseña.
                  </span>
                </form>
              </>
            )}

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M21.6 12.23c0-.74-.07-1.45-.19-2.14H12v4.05h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.44z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.89 6.62-2.33l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.75-5.59-4.11H3.08v2.59A10 10 0 0 0 12 22z"
        fill="#34A853"
      />
      <path
        d="M6.41 14a6 6 0 0 1 0-3.82V7.59H3.08a10 10 0 0 0 0 8.82L6.41 14z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.98c1.47 0 2.78.5 3.82 1.49l2.87-2.87C16.95 2.98 14.69 2 12 2a10 10 0 0 0-8.92 5.59l3.33 2.59C7.2 7.73 9.4 5.98 12 5.98z"
        fill="#EA4335"
      />
    </svg>
  );
}

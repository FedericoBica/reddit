import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo, Wordmark } from "@/app/components/logo";
import { getCurrentUser } from "@/modules/auth/server";
import { requestSignUpCode, verifySignUpCode } from "@/modules/auth/actions";

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
    <main className="auth-shell">
      <section className="auth-story" aria-label="ReddProwl">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={30} />
          <Wordmark size={20} />
        </div>

        <div style={{ maxWidth: 680 }}>
          <span className="eyebrow">Alta de cuenta</span>
          <h1
            style={{
              fontSize: "clamp(42px, 7vw, 76px)",
              lineHeight: 0.96,
              letterSpacing: "-0.055em",
              fontWeight: 900,
              marginTop: 24,
              maxWidth: 720,
            }}
          >
            Creá tu Searchbox y empezá a cazar intención real.
          </h1>
          <p className="page-copy" style={{ fontSize: 18, marginTop: 24 }}>
            Te mandamos un código para confirmar el email. Después pasás al
            setup del primer proyecto.
          </p>
        </div>

        <div className="panel panel-pad" style={{ maxWidth: 640 }}>
          <p className="section-title">Flujo de alta</p>
          <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
            {[
              ["01", "Ingresás tu email"],
              ["02", "Pegás el código que llega a Mailpit o tu inbox"],
              ["03", "Configurás producto, keywords y subreddits"],
            ].map(([step, text]) => (
              <div key={step} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <span
                  style={{
                    color: "#E07000",
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    minWidth: 38,
                  }}
                >
                  {step}
                </span>
                <span style={{ fontSize: 14, color: "#6B6B6E", lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div style={{ maxWidth: 390, width: "100%", margin: "0 auto" }}>
          <p className="page-kicker">Signup</p>
          <h2 className="page-title" style={{ fontSize: 38 }}>
            {isCodeStep ? "Confirmá tu email" : "Crear cuenta"}
          </h2>
          <p className="page-copy">
            {isCodeStep
              ? `Ingresá el código que enviamos a ${email}.`
              : "Usá tu email de trabajo para crear el acceso inicial."}
          </p>

          {params?.error && (
            <div
              className="panel panel-pad"
              style={{
                marginTop: 22,
                borderColor: "#FEE2E2",
                background: "#FEF2F2",
                color: "#991B1B",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {params.error}
            </div>
          )}

          {isCodeStep ? (
            <form action={verifySignUpCode} style={{ display: "grid", gap: 18, marginTop: 26 }}>
              <input type="hidden" name="email" value={email} />
              <label className="field-group">
                <span className="field-label">Código de verificación</span>
                <input
                  className="input"
                  name="token"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  required
                />
                <span className="field-hint">
                  En local lo ves en Mailpit: http://127.0.0.1:54324
                </span>
              </label>
              <button className="button button-primary" type="submit">
                Confirmar y continuar
              </button>
            </form>
          ) : (
            <form action={requestSignUpCode} style={{ display: "grid", gap: 18, marginTop: 26 }}>
              <label className="field-group">
                <span className="field-label">Email de trabajo</span>
                <input
                  className="input"
                  name="email"
                  type="email"
                  placeholder="vos@empresa.com"
                  autoComplete="email"
                  required
                />
              </label>
              <button className="button button-primary" type="submit">
                Enviarme código
              </button>
            </form>
          )}

          <p className="section-copy" style={{ marginTop: 18, textAlign: "center" }}>
            ¿Ya tenés cuenta?{" "}
            <a
              href="/login"
              style={{ color: "#E07000", fontWeight: 800, textDecoration: "none" }}
            >
              Entrar
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

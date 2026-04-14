import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo, Wordmark } from "@/app/components/logo";
import { signInWithMagicLink } from "@/modules/auth/actions";
import { getCurrentUser } from "@/modules/auth/server";

export const metadata: Metadata = {
  title: "Ingresar",
};

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    error?: string;
    sent?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const next = sanitizeNext(params?.next);

  if (user) {
    redirect(next);
  }

  return (
    <main className="auth-shell">
      <section className="auth-story" aria-label="ReddProwl">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={30} />
          <Wordmark size={20} />
        </div>

        <div style={{ maxWidth: 660 }}>
          <span className="eyebrow">Leads de Reddit en piloto automático</span>
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
            Encontrá clientes donde ya están pidiendo tu producto.
          </h1>
          <p className="page-copy" style={{ fontSize: 18, marginTop: 24 }}>
            ReddProwl detecta intención de compra, prioriza oportunidades y te
            ayuda a responder sin sonar como spam.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            maxWidth: 700,
          }}
        >
          {[
            ["92%", "relevancia esperada"],
            ["60s", "primer setup"],
            ["3x", "más rápido que manual"],
          ].map(([value, label]) => (
            <div className="metric" key={label}>
              <div className="metric-value">{value}</div>
              <div className="metric-note">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="auth-panel">
        <div style={{ maxWidth: 390, width: "100%", margin: "0 auto" }}>
          <p className="page-kicker">Acceso</p>
          <h2 className="page-title" style={{ fontSize: 38 }}>
            Entrá a tu dashboard
          </h2>
          <p className="page-copy">
            Si ya tenés cuenta, te mandamos un link de acceso. Las cuentas
            nuevas se crean desde signup.
          </p>

          {params?.sent === "1" && (
            <div
              className="panel panel-pad"
              style={{
                marginTop: 22,
                borderColor: "#D1FAE5",
                background: "#F0FDF4",
                color: "#065F46",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              Te enviamos el link de acceso. Revisá tu email y abrilo en este navegador.
            </div>
          )}

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

          <form action={signInWithMagicLink} style={{ display: "grid", gap: 18, marginTop: 26 }}>
            <input type="hidden" name="next" value={next} />
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
              Entrar con magic link
              <ArrowRightIcon />
            </button>
          </form>

          <p className="section-copy" style={{ marginTop: 18, textAlign: "center" }}>
            ¿No tenés cuenta?{" "}
            <a
              href="/signup"
              style={{ color: "#E07000", fontWeight: 800, textDecoration: "none" }}
            >
              Crear cuenta
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

function sanitizeNext(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

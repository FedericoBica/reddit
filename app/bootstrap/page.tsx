import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo, Wordmark } from "@/app/components/logo";
import { listProjectsForCurrentUser } from "@/db/queries/projects";
import { requireUser } from "@/modules/auth/server";
import { createFirstProject } from "@/modules/projects/actions";

export const metadata: Metadata = {
  title: "Crear proyecto",
};

export default async function BootstrapPage() {
  await requireUser("/bootstrap");
  const projects = await listProjectsForCurrentUser();

  if (projects.length > 0) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={30} />
          <Wordmark size={20} />
        </div>

        <div style={{ maxWidth: 700 }}>
          <span className="eyebrow">Setup en 5 minutos</span>
          <h1
            style={{
              fontSize: "clamp(40px, 7vw, 72px)",
              lineHeight: 0.98,
              letterSpacing: "-0.055em",
              fontWeight: 900,
              marginTop: 24,
            }}
          >
            Decinos qué vendés. Nosotros buscamos señales de compra.
          </h1>
          <p className="page-copy" style={{ fontSize: 18, marginTop: 24 }}>
            Con tu web y una descripción corta generamos keywords, subreddits y
            un primer mapa de intención.
          </p>
        </div>

        <div className="panel panel-pad" style={{ maxWidth: 640 }}>
          <p className="section-title">Qué pasa después</p>
          <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
            {[
              ["01", "Generamos sugerencias iniciales"],
              ["02", "Elegís qué keywords y subreddits usar"],
              ["03", "El scraper empieza a buscar leads relevantes"],
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
        <div style={{ maxWidth: 430, width: "100%", margin: "0 auto" }}>
          <p className="page-kicker">Primer proyecto</p>
          <h2 className="page-title" style={{ fontSize: 38 }}>
            Configurá tu Searchbox
          </h2>
          <p className="page-copy">
            Mantené la descripción concreta. Cuanto más claro el ICP, mejores
            van a ser las sugerencias.
          </p>

          <form action={createFirstProject} style={{ display: "grid", gap: 18, marginTop: 28 }}>
            <label className="field-group">
              <span className="field-label">Nombre del proyecto</span>
              <input className="input" name="name" placeholder="Mi SaaS" required maxLength={120} />
            </label>

            <label className="field-group">
              <span className="field-label">Sitio web</span>
              <input
                className="input"
                name="websiteUrl"
                type="url"
                placeholder="https://tuproducto.com"
              />
              <span className="field-hint">Opcional, pero ayuda a detectar posicionamiento.</span>
            </label>

            <label className="field-group">
              <span className="field-label">Propuesta de valor</span>
              <textarea
                className="textarea"
                name="valueProposition"
                placeholder="Ayudamos a equipos B2B a..."
                maxLength={2000}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label className="field-group">
                <span className="field-label">Región</span>
                <input className="input" name="region" placeholder="US, LATAM, global" />
              </label>
              <label className="field-group">
                <span className="field-label">Idioma</span>
                <select className="select" name="primaryLanguage" defaultValue="en">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="pt">Português</option>
                </select>
              </label>
            </div>

            <button className="button button-primary" type="submit">
              Crear proyecto
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

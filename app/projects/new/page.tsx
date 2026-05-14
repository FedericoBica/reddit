import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { requireUser } from "@/modules/auth/server";
import { BrandLink } from "@/app/components/logo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  analyzeNewProjectWebsite,
  confirmNewProjectDescription,
  createAdditionalProjectFromProfile,
  resetNewProjectAnalysis,
} from "@/modules/projects/actions";
import {
  NewProjectAnalyzeButton,
  NewProjectSubmitButton,
} from "./new-project-buttons";

type Props = {
  searchParams?: Promise<{ analyzed?: string; step?: string; error?: string }>;
};

function fromB64url(value: string) {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return "";
  }
}

export default async function NewProjectPage({ searchParams }: Props) {
  await requireUser("/projects/new");
  const params = await searchParams;
  const locale = await getLocale();
  const copy = getNewProjectCopy(locale);

  const analyzed = params?.analyzed === "1";
  const step = params?.step;
  const error = params?.error ? decodeURIComponent(params.error) : null;

  const cookieStore = await cookies();
  const website = fromB64url(cookieStore.get("new_project_website")?.value ?? "");
  const description = fromB64url(cookieStore.get("new_project_description")?.value ?? "");

  if (analyzed && step === "competitors") {
    if (!website || !description) redirect("/projects/new");
    return <StepCompetitors website={website} description={description} error={error} copy={copy} />;
  }

  if (analyzed) {
    if (!website || !description) redirect("/projects/new");
    return <StepConfirmDescription website={website} description={description} error={error} copy={copy} />;
  }

  return <StepWebsite error={error} copy={copy} />;
}

function getNewProjectCopy(locale: string) {
  if (locale.startsWith("es")) {
    return {
      back: "← Volver al dashboard",
      newProject: "Nuevo proyecto",
      analyzeDescription: "Ingresá el sitio de tu producto y lo analizamos para prellenar la configuración.",
      websiteUrl: "URL del sitio",
      websitePlaceholder: "https://tuproducto.com",
      websiteHint: "Vamos a leer la página y generar una descripción automáticamente.",
      confirmDescription: "Confirmar descripción",
      confirmDescriptionBody: "Analizamos",
      confirmDescriptionSuffix: "Editá la descripción si hace falta: esto es lo que usa la IA para redactar respuestas.",
      valueProposition: "Propuesta de valor",
      looksGood: "Se ve bien →",
      startOver: "← Empezar de nuevo",
      addCompetitors: "Agregar competidores",
      optional: "(opcional)",
      competitorsBody: "El contexto de competidores ayuda a que la IA escriba respuestas más diferenciadas. Podés saltearlo.",
      competitor: "Competidor",
      competitorPlaceholder: "https://competidor.com",
      createProject: "Crear proyecto",
    };
  }
  if (locale.startsWith("pt")) {
    return {
      back: "← Voltar ao dashboard",
      newProject: "Novo projeto",
      analyzeDescription: "Informe o site do seu produto e vamos analisá-lo para pré-preencher a configuração.",
      websiteUrl: "URL do site",
      websitePlaceholder: "https://seuproduto.com",
      websiteHint: "Vamos buscar a página e gerar uma descrição automaticamente.",
      confirmDescription: "Confirmar descrição",
      confirmDescriptionBody: "Analisamos",
      confirmDescriptionSuffix: "Edite a descrição se necessário: é isso que a IA usa para escrever respostas.",
      valueProposition: "Proposta de valor",
      looksGood: "Parece bom →",
      startOver: "← Recomeçar",
      addCompetitors: "Adicionar concorrentes",
      optional: "(opcional)",
      competitorsBody: "O contexto de concorrentes ajuda a IA a escrever respostas mais diferenciadas. Você pode pular esta etapa.",
      competitor: "Concorrente",
      competitorPlaceholder: "https://concorrente.com",
      createProject: "Criar projeto",
    };
  }
  return {
    back: "← Back to dashboard",
    newProject: "New project",
    analyzeDescription: "Enter your product's website and we'll analyze it to pre-fill your setup.",
    websiteUrl: "Website URL",
    websitePlaceholder: "https://yourproduct.com",
    websiteHint: "We'll fetch the page and generate a description automatically.",
    confirmDescription: "Confirm description",
    confirmDescriptionBody: "We analyzed",
    confirmDescriptionSuffix: "Edit the description if needed — this is what the AI uses to craft replies.",
    valueProposition: "Value proposition",
    looksGood: "Looks good →",
    startOver: "← Start over",
    addCompetitors: "Add competitors",
    optional: "(optional)",
    competitorsBody: "Competitor context helps the AI write more differentiated replies. You can skip this.",
    competitor: "Competitor",
    competitorPlaceholder: "https://competitor.com",
    createProject: "Create project",
  };
}

function StepWrapper({ step, total, children, backLabel }: { step: number; total: number; children: React.ReactNode; backLabel: string }) {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "#FAFAFA" }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ marginBottom: 32 }}>
          <BrandLink logoSize={22} wordmarkSize={14} style={{ gap: 6, marginBottom: 24 }} />
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 3,
                  flex: 1,
                  borderRadius: 99,
                  background: i < step ? "#FF4500" : "#E5E7EB",
                  transition: "background 200ms",
                }}
              />
            ))}
          </div>
        </div>
        {children}
        <p style={{ marginTop: 20, fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
          <Link href="/dashboard" style={{ color: "#9CA3AF" }}>{backLabel}</Link>
        </p>
      </div>
    </main>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ padding: "10px 14px", borderRadius: 6, background: "#FBE2E5", border: "1px solid #F2B7BD", color: "#EA0027", fontSize: 12, marginBottom: 16 }}>
      {message}
    </div>
  );
}

function StepWebsite({ error, copy }: { error: string | null; copy: ReturnType<typeof getNewProjectCopy> }) {
  return (
    <StepWrapper step={1} total={3} backLabel={copy.back}>
      <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em", color: "#1A1A1B", marginBottom: 6 }}>
        {copy.newProject}
      </h1>
      <p style={{ fontSize: 13, color: "#6B6B6E", marginBottom: 24, lineHeight: 1.5 }}>
        {copy.analyzeDescription}
      </p>

      {error && <ErrorBanner message={error} />}

      <form action={analyzeNewProjectWebsite} style={{ display: "grid", gap: 14 }}>
        <label className="field-group">
          <span className="field-label">{copy.websiteUrl}</span>
          <Input
            className="h-11 rounded-[8px] bg-white px-3 text-sm"
            name="website"
            type="url"
            placeholder={copy.websitePlaceholder}
            required
            autoFocus
          />
          <span className="field-hint">{copy.websiteHint}</span>
        </label>
        <NewProjectAnalyzeButton />
      </form>
    </StepWrapper>
  );
}

function StepConfirmDescription({ website, description, error, copy }: { website: string; description: string; error: string | null; copy: ReturnType<typeof getNewProjectCopy> }) {
  return (
    <StepWrapper step={2} total={3} backLabel={copy.back}>
      <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em", color: "#1A1A1B", marginBottom: 6 }}>
        {copy.confirmDescription}
      </h1>
      <p style={{ fontSize: 13, color: "#6B6B6E", marginBottom: 24, lineHeight: 1.5 }}>
        {copy.confirmDescriptionBody} <strong style={{ color: "#1A1A1B" }}>{website}</strong>. {copy.confirmDescriptionSuffix}
      </p>

      {error && <ErrorBanner message={error} />}

      <form action={confirmNewProjectDescription} style={{ display: "grid", gap: 14 }}>
        <input type="hidden" name="website" value={website} />
        <label className="field-group">
          <span className="field-label">{copy.valueProposition}</span>
          <Textarea
            className="min-h-[140px] rounded-[8px] bg-white px-3 py-3 text-sm"
            name="description"
            defaultValue={description}
            maxLength={2000}
            required
          />
        </label>
        <NewProjectSubmitButton label={copy.looksGood} />
      </form>

      <form action={resetNewProjectAnalysis} style={{ marginTop: 8 }}>
        <button type="submit" style={{ background: "none", border: "none", fontSize: 12, color: "#9CA3AF", cursor: "pointer", padding: 0 }}>
          {copy.startOver}
        </button>
      </form>
    </StepWrapper>
  );
}

function StepCompetitors({ website, description, error, copy }: { website: string; description: string; error: string | null; copy: ReturnType<typeof getNewProjectCopy> }) {
  return (
    <StepWrapper step={3} total={3} backLabel={copy.back}>
      <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em", color: "#1A1A1B", marginBottom: 6 }}>
        {copy.addCompetitors} <span style={{ fontSize: 16, fontWeight: 500, color: "#9CA3AF" }}>{copy.optional}</span>
      </h1>
      <p style={{ fontSize: 13, color: "#6B6B6E", marginBottom: 24, lineHeight: 1.5 }}>
        {copy.competitorsBody}
      </p>

      {error && <ErrorBanner message={error} />}

      <form action={createAdditionalProjectFromProfile} style={{ display: "grid", gap: 14 }}>
        <input type="hidden" name="website" value={website} />
        <input type="hidden" name="description" value={description} />

        {[1, 2, 3].map((i) => (
          <label key={i} className="field-group">
            <span className="field-label">{copy.competitor} {i}</span>
            <Input
              className="h-11 rounded-[8px] bg-white px-3 text-sm"
              name="competitorUrl"
              type="url"
              placeholder={copy.competitorPlaceholder}
            />
          </label>
        ))}

        <NewProjectSubmitButton label={copy.createProject} />
      </form>
    </StepWrapper>
  );
}

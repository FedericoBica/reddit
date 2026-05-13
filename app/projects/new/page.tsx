import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
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

  const analyzed = params?.analyzed === "1";
  const step = params?.step;
  const error = params?.error ? decodeURIComponent(params.error) : null;

  const cookieStore = await cookies();
  const website = fromB64url(cookieStore.get("new_project_website")?.value ?? "");
  const description = fromB64url(cookieStore.get("new_project_description")?.value ?? "");

  if (analyzed && step === "competitors") {
    if (!website || !description) redirect("/projects/new");
    return <StepCompetitors website={website} description={description} error={error} />;
  }

  if (analyzed) {
    if (!website || !description) redirect("/projects/new");
    return <StepConfirmDescription website={website} description={description} error={error} />;
  }

  return <StepWebsite error={error} />;
}

function StepWrapper({ step, total, children }: { step: number; total: number; children: React.ReactNode }) {
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
          <Link href="/dashboard" style={{ color: "#9CA3AF" }}>← Back to dashboard</Link>
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

function StepWebsite({ error }: { error: string | null }) {
  return (
    <StepWrapper step={1} total={3}>
      <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em", color: "#1A1A1B", marginBottom: 6 }}>
        New project
      </h1>
      <p style={{ fontSize: 13, color: "#6B6B6E", marginBottom: 24, lineHeight: 1.5 }}>
        Enter your product's website and we'll analyze it to pre-fill your setup.
      </p>

      {error && <ErrorBanner message={error} />}

      <form action={analyzeNewProjectWebsite} style={{ display: "grid", gap: 14 }}>
        <label className="field-group">
          <span className="field-label">Website URL</span>
          <Input
            className="h-11 rounded-[8px] bg-white px-3 text-sm"
            name="website"
            type="url"
            placeholder="https://yourproduct.com"
            required
            autoFocus
          />
          <span className="field-hint">We'll fetch the page and generate a description automatically.</span>
        </label>
        <NewProjectAnalyzeButton />
      </form>
    </StepWrapper>
  );
}

function StepConfirmDescription({ website, description, error }: { website: string; description: string; error: string | null }) {
  return (
    <StepWrapper step={2} total={3}>
      <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em", color: "#1A1A1B", marginBottom: 6 }}>
        Confirm description
      </h1>
      <p style={{ fontSize: 13, color: "#6B6B6E", marginBottom: 24, lineHeight: 1.5 }}>
        We analyzed <strong style={{ color: "#1A1A1B" }}>{website}</strong>. Edit the description if needed — this is what the AI uses to craft replies.
      </p>

      {error && <ErrorBanner message={error} />}

      <form action={confirmNewProjectDescription} style={{ display: "grid", gap: 14 }}>
        <input type="hidden" name="website" value={website} />
        <label className="field-group">
          <span className="field-label">Value proposition</span>
          <Textarea
            className="min-h-[140px] rounded-[8px] bg-white px-3 py-3 text-sm"
            name="description"
            defaultValue={description}
            maxLength={2000}
            required
          />
        </label>
        <NewProjectSubmitButton label="Looks good →" />
      </form>

      <form action={resetNewProjectAnalysis} style={{ marginTop: 8 }}>
        <button type="submit" style={{ background: "none", border: "none", fontSize: 12, color: "#9CA3AF", cursor: "pointer", padding: 0 }}>
          ← Start over
        </button>
      </form>
    </StepWrapper>
  );
}

function StepCompetitors({ website, description, error }: { website: string; description: string; error: string | null }) {
  return (
    <StepWrapper step={3} total={3}>
      <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em", color: "#1A1A1B", marginBottom: 6 }}>
        Add competitors <span style={{ fontSize: 16, fontWeight: 500, color: "#9CA3AF" }}>(optional)</span>
      </h1>
      <p style={{ fontSize: 13, color: "#6B6B6E", marginBottom: 24, lineHeight: 1.5 }}>
        Competitor context helps the AI write more differentiated replies. You can skip this.
      </p>

      {error && <ErrorBanner message={error} />}

      <form action={createAdditionalProjectFromProfile} style={{ display: "grid", gap: 14 }}>
        <input type="hidden" name="website" value={website} />
        <input type="hidden" name="description" value={description} />

        {[1, 2, 3].map((i) => (
          <label key={i} className="field-group">
            <span className="field-label">Competitor {i}</span>
            <Input
              className="h-11 rounded-[8px] bg-white px-3 text-sm"
              name="competitorUrl"
              type="url"
              placeholder="https://competitor.com"
            />
          </label>
        ))}

        <NewProjectSubmitButton label="Create project" />
      </form>
    </StepWrapper>
  );
}

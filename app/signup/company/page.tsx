import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/modules/auth/server";
import {
  analyzeCompanyWebsite,
  createProjectFromCompanyProfile,
} from "./actions";
import { CompanyWebsiteAnalyzer } from "./company-website-analyzer";

export const metadata: Metadata = {
  title: "Tu compañía",
};

type CompanyPageProps = {
  searchParams?: Promise<{
    analyzed?: string;
    error?: string;
  }>;
};

export default async function SignupCompanyPage({ searchParams }: CompanyPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const cookieStore = await cookies();
  const website = decodeCookieValue(cookieStore.get("signup_company_website")?.value);
  const description = decodeCookieValue(cookieStore.get("signup_company_description")?.value);
  const analyzed = Boolean(website && description);

  if (!user) {
    redirect("/signup");
  }

  return (
    <main className="signup-wizard-shell">
      <header className="signup-wizard-brand">
        <BrandLink logoSize={28} wordmarkSize={18} />
      </header>

      <Card className="signup-wizard-card">
        <CardContent className="signup-wizard-content">
          {!analyzed ? (
            <CompanyWebsiteAnalyzer action={analyzeCompanyWebsite} error={params?.error} />
          ) : (
            <>
              <section className="signup-wizard-main">
                <StepDots active={1} total={5} />
                <p className="page-kicker">Company</p>
                <h1 className="signup-wizard-title">AI generated company description</h1>
                <p className="signup-wizard-copy">
                  Review the description before we set up your competitor scan.
                </p>
                {params?.error && <div className="signup-error">{params.error}</div>}
                <form action={createProjectFromCompanyProfile} className="signup-form">
                  <input type="hidden" name="website" value={website} />
                  <label className="field-group">
                    <span className="field-label">Company description</span>
                    <Textarea
                      className="min-h-[132px] rounded-[8px] bg-white px-3 py-3 text-sm"
                      name="description"
                      defaultValue={description}
                      maxLength={800}
                      required
                    />
                  </label>
                  <Button className="h-11 rounded-[8px] font-extrabold" type="submit">
                    Next
                  </Button>
                </form>
              </section>

              <aside className="signup-wizard-visual">
                <div className="signup-analysis-list">
                  <AnalysisStep done title="Analyzing your website" text="Website analysis complete." />
                  <AnalysisStep done title="Discovering high intent keywords" text="Keywords are saved in the background." />
                  <AnalysisStep done title="Generating company description" text="Review your generated description." />
                </div>
              </aside>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function decodeCookieValue(value?: string) {
  if (!value) {
    return "";
  }

  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(value)) {
    return isReadableText(value) ? sanitizeText(value) : "";
  }

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    return isReadableText(decoded) ? sanitizeText(decoded) : "";
  } catch {
    return isReadableText(value) ? sanitizeText(value) : "";
  }
}

function isReadableText(value: string) {
  if (!value.trim()) {
    return false;
  }

  const replacementChars = (value.match(/\uFFFD/g) ?? []).length;
  const controlChars = (value.match(/[\u0000-\u0008\u000E-\u001F]/g) ?? []).length;

  return replacementChars === 0 && controlChars === 0;
}

function sanitizeText(value: string) {
  return value.replace(/[\u0000-\u0008\u000E-\u001F]/g, "").trim();
}

function StepDots({ active, total }: { active: number; total: number }) {
  return (
    <div className="signup-step-dots">
      {Array.from({ length: total }).map((_, index) => (
        <span key={index} className={index === active ? "signup-step-dot-active" : ""} />
      ))}
    </div>
  );
}

function AnalysisStep({ done, title, text }: { done: boolean; title: string; text: string }) {
  return (
    <div className="signup-analysis-step">
      <span className={done ? "signup-analysis-dot-done" : ""} />
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

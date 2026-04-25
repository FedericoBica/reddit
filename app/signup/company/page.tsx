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
import { SignupProgress } from "@/app/signup/components/signup-progress";

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

      <div className="sw-progress-wrap">
        <SignupProgress active={0} />
      </div>

      <Card className="signup-wizard-card">
        <CardContent className="signup-wizard-content" style={{ padding: 0 }}>
          {!analyzed ? (
            <CompanyWebsiteAnalyzer action={analyzeCompanyWebsite} error={params?.error} />
          ) : (
            <>
              <section className="signup-wizard-main">
                <div className="sw-eyebrow">
                  <span className="sw-eyebrow-dot" />
                  Step 01 · Company
                </div>
                <h1 className="signup-wizard-title">
                  AI-generated<br /><em>company brief.</em>
                </h1>
                <p className="signup-wizard-copy">
                  Review the description before we set up your competitor scan.
                </p>
                {params?.error && <div className="signup-error">{params.error}</div>}
                <form action={createProjectFromCompanyProfile} className="signup-form">
                  <input type="hidden" name="website" value={website} />
                  <label className="field-group">
                    <span className="field-label">Company description</span>
                    <Textarea
                      className="min-h-[132px] rounded-[10px] bg-white px-3 py-3 text-sm"
                      name="description"
                      defaultValue={description}
                      maxLength={800}
                      required
                    />
                  </label>
                  <Button className="h-11 rounded-[10px] font-bold text-sm" type="submit">
                    Continue →
                  </Button>
                </form>
              </section>

              <aside className="signup-wizard-visual">
                <div className="sw-pane-eyebrow">
                  <span style={{ color: "oklch(0.58 0.18 38)", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em" }}>Analysis complete</span>
                  <span className="sw-pane-meta">3 steps done</span>
                </div>
                <div className="sw-run-list">
                  <AnalysisStep done title="Analyzing your website" text="Complete" />
                  <AnalysisStep done title="Discovering high-intent keywords" text="Keywords saved in background" />
                  <AnalysisStep done title="Generating company brief" text="Ready to review" />
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

function AnalysisStep({ done, title, text }: { done: boolean; title: string; text: string }) {
  return (
    <div className={`sw-run-item${done ? " sw-run-item-done" : ""}`}>
      <div className="sw-run-icon">
        {done ? <span>✓</span> : null}
      </div>
      <div className="sw-run-text">
        <span className="sw-run-title">{title}</span>
        <span className="sw-run-status">{text}</span>
      </div>
    </div>
  );
}

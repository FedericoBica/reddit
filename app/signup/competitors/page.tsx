import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/modules/auth/server";
import { saveCompetitorsFromSignup } from "@/modules/onboarding/signup-actions";
import { CompetitorsForm } from "./competitors-form";

export const metadata: Metadata = {
  title: "Competidores",
};

type CompetitorsPageProps = {
  searchParams?: Promise<{ projectId?: string; error?: string }>;
};

export default async function SignupCompetitorsPage({ searchParams }: CompetitorsPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const projectId = params?.projectId ?? "";

  if (!user) redirect("/signup");
  if (!projectId) redirect("/signup/company");

  return (
    <main className="signup-wizard-shell">
      <header className="signup-wizard-brand">
        <BrandLink logoSize={28} wordmarkSize={18} />
      </header>

      <Card className="signup-wizard-card">
        <CardContent className="signup-wizard-content">
          <section className="signup-wizard-main">
            <StepDots active={2} total={5} />
            <p className="page-kicker">Competitors</p>
            <h1 className="signup-wizard-title">How are your competitors?</h1>
            <p className="signup-wizard-copy">
              Add competitor websites so ReddProwl can detect comparisons.
            </p>

            {params?.error && <div className="signup-error">{params.error}</div>}

            <CompetitorsForm action={saveCompetitorsFromSignup} projectId={projectId} />
          </section>

          <aside className="signup-wizard-visual">
            <div className="signup-preview-card">
              <p className="page-kicker">Battlecards</p>
              <h3>When someone compares you, you&apos;ll know what to say.</h3>
              <div className="signup-mini-post">
                <strong>What are good HubSpot alternatives?</strong>
                <span>Relevance 92/100</span>
              </div>
            </div>
          </aside>
        </CardContent>
      </Card>
    </main>
  );
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

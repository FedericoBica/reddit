import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo, Wordmark } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/modules/auth/server";
import { saveCompetitorsFromSignup } from "@/modules/onboarding/signup-actions";

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
        <Logo size={28} />
        <Wordmark size={18} />
      </header>

      <Card className="signup-wizard-card">
        <CardContent className="signup-wizard-content">
          <section className="signup-wizard-main">
            <StepDots active={2} total={5} />
            <p className="page-kicker">Competitors</p>
            <h1 className="signup-wizard-title">And now, who are your competitors?</h1>
            <p className="signup-wizard-copy">
              We&apos;ll use this to monitor mentions, detect comparisons and
              prepare Battlecards.
            </p>

            {params?.error && <div className="signup-error">{params.error}</div>}

            <form action={saveCompetitorsFromSignup} className="signup-form">
              <input type="hidden" name="projectId" value={projectId} />
              {[1, 2, 3].map((index) => (
                <label className="field-group" key={index}>
                  <span className="field-label">{index}. Competitor</span>
                  <Input
                    className="h-11 rounded-[8px] bg-white px-3 text-sm"
                    name="competitorUrl"
                    type="url"
                    placeholder="https://competitor.com"
                    required={index === 1}
                  />
                </label>
              ))}
              <span className="field-hint">
                Add at least one. The more, the better. URLs must be accessible.
              </span>
              <Button className="h-11 rounded-[8px] font-extrabold" type="submit">
                Next
              </Button>
            </form>
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

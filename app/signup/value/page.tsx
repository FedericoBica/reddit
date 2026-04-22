import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/modules/auth/server";
import { isCurrentUserAdmin } from "@/modules/auth/admin";
import { continueToPlan } from "@/modules/onboarding/signup-actions";
import { ValuePanel } from "./value-panel";

export const metadata: Metadata = {
  title: "Cómo ayuda ReddProwl",
};

type ValuePageProps = {
  searchParams?: Promise<{ projectId?: string; preview?: string }>;
};

export default async function SignupValuePage({ searchParams }: ValuePageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const projectId = params?.projectId ?? "";

  if (!user) redirect("/signup");
  if (!projectId) {
    if (params?.preview === "1" && await isCurrentUserAdmin()) {
      // Admin preview mode
    } else {
      redirect("/signup/company");
    }
  }

  return (
    <main className="signup-wizard-shell">
      <header className="signup-wizard-brand">
        <BrandLink logoSize={28} wordmarkSize={18} />
      </header>

      <Card className="signup-wizard-card">
        <CardContent className="signup-wizard-content">
          <section className="signup-wizard-main">
            <StepDots active={3} total={5} />
            <p className="page-kicker">Why Reddit</p>
            <h1 className="signup-wizard-title">
              Let ReddProwl help you get more customers
            </h1>
            <p className="signup-wizard-copy">
              Reddit is full of people asking for tools, comparing vendors and
              describing urgent pain.
            </p>

            <div className="signup-value-list">
              <ValueItem title="Find buyers early" text="Catch recommendation requests before competitors do." />
              <ValueItem title="Reply with context" text="Use the post and your positioning." />
              <ValueItem title="Protect your account" text="Avoid spam patterns." />
            </div>

            <form action={continueToPlan}>
              <input type="hidden" name="projectId" value={projectId} />
              <Button
                className="h-11 w-full rounded-[8px] font-extrabold text-sm"
                type="submit"
              >
                Next →
              </Button>
            </form>
          </section>

          <aside className="signup-wizard-visual">
            <ValuePanel />
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

function ValueItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="signup-value-item">
      <span />
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}


import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/modules/auth/server";
import { choosePlanFromSignup } from "@/modules/onboarding/signup-actions";

export const metadata: Metadata = {
  title: "Elegir plan",
};

type PlanPageProps = {
  searchParams?: Promise<{ projectId?: string }>;
};

const plans = [
  { id: "startup", name: "Startup", price: "$19", note: "Start finding Reddit leads" },
  { id: "growth", name: "Growth", price: "$39", note: "More daily opportunities" },
  { id: "professional", name: "Professional", price: "$79", note: "For multiple brands" },
];

export default async function SignupPlanPage({ searchParams }: PlanPageProps) {
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
            <StepDots active={4} total={5} />
            <p className="page-kicker">Plan</p>
            <h1 className="signup-wizard-title">Choose your plan</h1>
            <p className="signup-wizard-copy">
              Pick a plan to finish onboarding.
            </p>
          </section>

          <aside className="signup-wizard-visual">
            <div className="signup-plan-stack">
              {plans.map((plan) => (
                <form action={choosePlanFromSignup} key={plan.id}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="plan" value={plan.id} />
                  <button
                    type="submit"
                    className={`signup-plan-card${plan.id === "growth" ? " signup-plan-card-popular" : ""}`}
                  >
                    <span>{plan.id === "growth" ? "Recommended" : plan.name}</span>
                    <strong>{plan.name}</strong>
                    <em>{plan.price}/mo</em>
                    <p>{plan.note}</p>
                    <span className="signup-plan-action">Finish</span>
                  </button>
                </form>
              ))}
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

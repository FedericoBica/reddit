import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo, Wordmark } from "@/app/components/logo";
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
  { id: "startup", name: "Startup", price: "$19", seats: "1 seat", note: "Para empezar a generar leads desde Reddit" },
  { id: "growth", name: "Growth", price: "$39", seats: "2 seats", note: "Insights diarios para convertir más leads" },
  { id: "professional", name: "Professional", price: "$79", seats: "3 seats", note: "Máximo alcance para múltiples marcas" },
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
        <Logo size={28} />
        <Wordmark size={18} />
      </header>

      <Card className="signup-wizard-card signup-wizard-card-wide">
        <CardContent className="p-8">
          <StepDots active={4} total={5} />
          <p className="page-kicker">Plan</p>
          <h1 className="signup-wizard-title">Choose your plan</h1>
          <p className="signup-wizard-copy">
            El plan elegido define límites como cantidad de proyectos. Podés
            cambiarlo luego desde billing.
          </p>

          <div className="signup-plan-grid">
            {plans.map((plan) => (
              <form action={choosePlanFromSignup} key={plan.id}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="plan" value={plan.id} />
                <button
                  type="submit"
                  className={`signup-plan-card${plan.id === "growth" ? " signup-plan-card-popular" : ""}`}
                >
                  {plan.id === "growth" && <span>Recommended</span>}
                  <strong>{plan.name}</strong>
                  <em>{plan.price}/mo</em>
                  <p>{plan.note}</p>
                  <small>{plan.seats}</small>
                </button>
              </form>
            ))}
          </div>
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

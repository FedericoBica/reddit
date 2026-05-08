import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/modules/auth/server";
import { PlanSelector } from "./plan-selector";

export const metadata: Metadata = {
  title: "Choose a plan",
};

export default async function SignupPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/signup");

  const { projectId } = await searchParams;

  return (
    <main className="signup-wizard-shell">
      <header className="signup-wizard-brand">
        <BrandLink logoSize={28} wordmarkSize={18} />
      </header>

      <Card className="signup-wizard-card">
        <CardContent className="p-0">
          <PlanSelector projectId={projectId} />
        </CardContent>
      </Card>
    </main>
  );
}

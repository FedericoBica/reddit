import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/modules/auth/server";
import { isCurrentUserAdmin } from "@/modules/auth/admin";
import { TutorialCard } from "./tutorial-card";

export const metadata: Metadata = {
  title: "Bienvenida",
};

type TutorialPageProps = {
  searchParams?: Promise<{ projectId?: string; preview?: string }>;
};

export default async function SignupTutorialPage({ searchParams }: TutorialPageProps) {
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
    <main className="signup-wizard-shell signup-tutorial-backdrop">
      <header className="signup-wizard-brand">
        <BrandLink logoSize={28} wordmarkSize={18} />
      </header>

      <Card className="signup-wizard-card">
        <CardContent className="signup-wizard-content">
          <TutorialCard projectId={projectId} />
        </CardContent>
      </Card>
    </main>
  );
}

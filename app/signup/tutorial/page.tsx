import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink, Logo } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/modules/auth/server";

export const metadata: Metadata = {
  title: "Bienvenida",
};

type TutorialPageProps = {
  searchParams?: Promise<{ projectId?: string }>;
};

export default async function SignupTutorialPage({ searchParams }: TutorialPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const projectId = params?.projectId ?? "";

  if (!user) redirect("/signup");
  if (!projectId) redirect("/signup/company");

  return (
    <main className="signup-wizard-shell signup-tutorial-backdrop">
      <header className="signup-wizard-brand">
        <BrandLink logoSize={28} wordmarkSize={18} />
      </header>

      <Card className="signup-tutorial-card">
        <CardContent className="p-0">
          <div className="signup-tutorial-hero">
            <h1>Welcome to ReddProwl</h1>
            <p>
              ReddProwl scans Reddit to find high-converting conversations for
              you. Your Searchbox will show posts ranked by intent.
            </p>
          </div>
          <div className="signup-tutorial-body">
            <div className="signup-tutorial-graphic">
              <Logo size={44} />
            </div>
            <p>
              Start by confirming keywords and subreddits. Then every lead will
              include context, intent score, Battlecards and reply generation.
            </p>
            <Button asChild className="h-10 rounded-[8px] font-extrabold">
              <a href={`/onboarding/project?projectId=${projectId}`}>Next</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

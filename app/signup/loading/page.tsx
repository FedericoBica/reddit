import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/modules/auth/server";
import { isCurrentUserAdmin } from "@/modules/auth/admin";
import { LoadingProgress } from "./loading-progress";

export const metadata: Metadata = {
  title: "Preparando ReddProwl",
};

type LoadingPageProps = {
  searchParams?: Promise<{ projectId?: string; preview?: string }>;
};

export default async function SignupLoadingPage({ searchParams }: LoadingPageProps) {
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

      <Card className="signup-loading-card">
        <CardContent className="signup-wizard-content">
          <section className="signup-wizard-main signup-loading-main">
            <div className="signup-loader" />
            <h1 className="signup-wizard-title">
              Learning about you and your competitors
            </h1>
            <LoadingProgress projectId={projectId} />
            <Button asChild className="h-11 rounded-[8px] font-extrabold">
              <a href={`/signup/tutorial?projectId=${projectId}`}>Continue</a>
            </Button>
          </section>

          <aside className="signup-wizard-visual">
            <FloatingPost title="Looking for a better CRM" score="94" />
            <FloatingPost title="Best tool for social leads?" score="91" />
            <FloatingPost title="Alternative to manual prospecting" score="89" />
          </aside>
        </CardContent>
      </Card>
    </main>
  );
}

function FloatingPost({ title, score }: { title: string; score: string }) {
  return (
    <div className="signup-floating-post">
      <span>Relevant post</span>
      <strong>{title}</strong>
      <em>Relevance {score}/100</em>
    </div>
  );
}

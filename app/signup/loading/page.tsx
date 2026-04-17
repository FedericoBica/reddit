import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/modules/auth/server";
import { LoadingProgress } from "./loading-progress";

export const metadata: Metadata = {
  title: "Preparando ReddProwl",
};

type LoadingPageProps = {
  searchParams?: Promise<{ projectId?: string }>;
};

export default async function SignupLoadingPage({ searchParams }: LoadingPageProps) {
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

      <Card className="signup-loading-card">
        <CardContent className="p-8">
          <div className="signup-loader" />
          <h1 className="signup-wizard-title" style={{ textAlign: "center" }}>
            Learning about you and your competitors
          </h1>
          <p className="signup-wizard-copy" style={{ textAlign: "center", margin: "14px auto 0" }}>
            We&apos;re preparing your searchbox and looking for relevant posts.
          </p>
          <LoadingProgress projectId={projectId} />
          <Button asChild className="mt-7 h-11 rounded-[8px] font-extrabold">
            <a href={`/signup/tutorial?projectId=${projectId}`}>Continue</a>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

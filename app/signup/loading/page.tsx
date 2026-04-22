import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { Card } from "@/components/ui/card";
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
        <div className="signup-loading-solo">
          <div className="signup-loader" />
          <h1 className="signup-wizard-title">
            Learning about you and your competitors
          </h1>
          <p className="signup-wizard-copy">
            This takes a few seconds — we&apos;re finding the best Reddit discussions for your product.
          </p>
          <LoadingProgress projectId={projectId} />
        </div>
      </Card>
    </main>
  );
}

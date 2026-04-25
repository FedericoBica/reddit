import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/modules/auth/server";
import { isCurrentUserAdmin } from "@/modules/auth/admin";
import { continueToPlan } from "@/modules/onboarding/signup-actions";
import { ValuePanel } from "./value-panel";
import { SignupProgress } from "@/app/signup/components/signup-progress";

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

      <div className="sw-progress-wrap">
        <SignupProgress active={2} />
      </div>

      <Card className="signup-wizard-card">
        <CardContent className="signup-wizard-content" style={{ padding: 0 }}>
          <section className="signup-wizard-main">
            <div className="sw-eyebrow">
              <span className="sw-eyebrow-dot" />
              Step 03 · Why Reddit
            </div>
            <h1 className="signup-wizard-title">
              Where buyers<br /><em>ask out loud.</em>
            </h1>
            <p className="signup-wizard-copy">
              Reddit is full of people comparing tools, asking for recommendations, and describing urgent pain — in plain language, with their wallet half-open.
            </p>

            <ul className="sw-checklist">
              <ValueItem title="Find buyers early" text="Catch recommendation requests before competitors do." />
              <ValueItem title="Reply with context" text="Drafts use the post and your positioning — not boilerplate." />
              <ValueItem title="Protect your account" text="Pace and tone checks keep you out of spam patterns." />
            </ul>

            <form action={continueToPlan}>
              <input type="hidden" name="projectId" value={projectId} />
              <Button
                className="sw-btn-primary w-full"
                type="submit"
              >
                Continue →
              </Button>
            </form>
          </section>

          <aside className="signup-wizard-visual">
            <div className="sw-pane-eyebrow">
              <span className="sw-live-tag">
                <span className="sw-pulse" />
                Live radar
              </span>
              <span className="sw-pane-meta">142 threads today</span>
            </div>
            <ValuePanel />
          </aside>
        </CardContent>
      </Card>
    </main>
  );
}

function ValueItem({ title, text }: { title: string; text: string }) {
  return (
    <li>
      <span className="sw-ch-icon">✓</span>
      <div>
        <div className="sw-ch-title">{title}</div>
        <div className="sw-ch-desc">{text}</div>
      </div>
    </li>
  );
}

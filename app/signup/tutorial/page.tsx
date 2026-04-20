import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandLink } from "@/app/components/logo";
import { getCurrentUser } from "@/modules/auth/server";
import { TutorialCard } from "./tutorial-card";

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

      <TutorialCard projectId={projectId} />
    </main>
  );
}

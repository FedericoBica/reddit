import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setProjectOnboardingStatus } from "@/db/mutations/projects";
import { requireUser } from "@/modules/auth/server";
import { isCurrentUserAdmin } from "@/modules/auth/admin";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = {
  title: "Onboarding",
};

type OnboardingPageProps = {
  searchParams?: Promise<{
    projectId?: string;
  }>;
};

export default async function ProjectOnboardingPage({ searchParams }: OnboardingPageProps) {
  await requireUser("/onboarding/project");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") {
    if (await isCurrentUserAdmin()) redirect("/admin");
    redirect("/signup/company");
  }

  const project = projectState.currentProject;

  if (project.onboarding_status !== "completed") {
    await setProjectOnboardingStatus(project.id, "completed", null);
  }

  redirect(`/dashboard?projectId=${project.id}`);
}

"use server";

import { redirect } from "next/navigation";
import { createProject } from "@/db/mutations/projects";
import { listProjectsForCurrentUser } from "@/db/queries/projects";
import { getCurrentBillingPlan } from "@/modules/billing/current";
import { canCreateProject } from "@/modules/billing/limits";
import { requireUser } from "@/modules/auth/server";
import { setCurrentProject } from "@/modules/projects/current";

export async function createFirstProject(formData: FormData) {
  await requireUser("/bootstrap");
  await createProjectFromForm(formData);
}

export async function createAdditionalProject(formData: FormData) {
  await requireUser("/projects/new");

  const projects = await listProjectsForCurrentUser();
  const limit = await getCurrentBillingPlan();

  if (!canCreateProject(projects.length, limit)) {
    redirect(
      `/projects/new?error=${encodeURIComponent(`Tu plan ${limit.label} permite hasta ${limit.maxProjects} proyectos.`)}`,
    );
  }

  await createProjectFromForm(formData);
}

async function createProjectFromForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const websiteUrl = emptyToNull(formData.get("websiteUrl"));
  const valueProposition = emptyToNull(formData.get("valueProposition"));
  const region = emptyToNull(formData.get("region"));
  const primaryLanguage = String(formData.get("primaryLanguage") ?? "en").trim() || "en";

  const project = await createProject({
    name,
    websiteUrl,
    valueProposition,
    region,
    primaryLanguage,
    currencyCode: "USD",
  });

  await setCurrentProject(project.id);
  redirect(`/onboarding/project?projectId=${project.id}`);
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createProject,
  setProjectOnboardingStatus,
} from "@/db/mutations/projects";
import { listProjectsForCurrentUser } from "@/db/queries/projects";
import { inngest } from "@/inngest/client";
import { getCurrentBillingPlan } from "@/modules/billing/current";
import { canCreateProject } from "@/modules/billing/limits";
import { requireUser } from "@/modules/auth/server";
import { analyzeCompanyWithAI } from "@/modules/onboarding/company-analyzer";
import { validateAccessibleWebsite } from "@/modules/onboarding/url-validation";
import { setCurrentProject } from "@/modules/projects/current";
import type { ProjectDTO } from "@/db/schemas/domain";

const NEW_PROJECT_WEBSITE_COOKIE = "new_project_website";
const NEW_PROJECT_DESCRIPTION_COOKIE = "new_project_description";

export async function createFirstProject(formData: FormData) {
  const user = await requireUser("/bootstrap");
  await createProjectFromForm(formData, user.id);
}

export async function analyzeNewProjectWebsite(formData: FormData) {
  await requireUser("/projects/new");

  const projects = await listProjectsForCurrentUser();
  const limit = await getCurrentBillingPlan();

  if (!canCreateProject(projects.length, limit)) {
    redirect(
      `/projects/new?error=${encodeURIComponent(`Tu plan ${limit.label} permite hasta ${limit.maxProjects} proyectos.`)}`,
    );
  }

  const website = String(formData.get("website") ?? "").trim();
  let draftUrl = "";
  let draftDescription = "";
  let errorMessage: string | null = null;

  try {
    const validated = await validateAccessibleWebsite(website);
    const analysis = await analyzeCompanyWithAI(validated);
    draftUrl = validated.url;
    draftDescription = analysis.description;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "No pudimos acceder a esa URL.";
  }

  if (errorMessage) {
    redirect(`/projects/new?error=${encodeURIComponent(errorMessage)}`);
  }

  await setNewProjectDraft(draftUrl, draftDescription);
  redirect("/projects/new?analyzed=1");
}

export async function createAdditionalProjectFromProfile(formData: FormData) {
  const user = await requireUser("/projects/new");

  const projects = await listProjectsForCurrentUser();
  const limit = await getCurrentBillingPlan();

  if (!canCreateProject(projects.length, limit)) {
    redirect(
      `/projects/new?error=${encodeURIComponent(`Tu plan ${limit.label} permite hasta ${limit.maxProjects} proyectos.`)}`,
    );
  }

  const website = String(formData.get("website") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!website || !description) {
    redirect(
      `/projects/new?error=${encodeURIComponent("Revisá el website y la descripción.")}`,
    );
  }

  let hostname = "";
  try {
    hostname = new URL(website).hostname.replace(/^www\./i, "");
  } catch {
    hostname = website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
  }

  const project = await createProject({
    name: hostname || "New project",
    websiteUrl: website,
    valueProposition: description,
    primaryLanguage: "en",
    currencyCode: "USD",
  });

  await autoCompleteOnboarding(project, user.id);
  await clearNewProjectDraft();
  await setCurrentProject(project.id);
  redirect(`/dashboard?projectId=${project.id}`);
}

export async function resetNewProjectAnalysis() {
  await requireUser("/projects/new");
  await clearNewProjectDraft();
  redirect("/projects/new");
}

async function createProjectFromForm(formData: FormData, userId: string) {
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

  await autoCompleteOnboarding(project, userId);
  await setCurrentProject(project.id);
  redirect(`/dashboard?projectId=${project.id}`);
}

async function autoCompleteOnboarding(project: ProjectDTO, userId: string) {
  // Mark completed immediately so the dashboard loads without redirecting to onboarding
  await setProjectOnboardingStatus(project.id, "completed", null);

  // Generate suggestions + trigger backfill in the background via Inngest
  await inngest.send({
    name: "project/setup.requested",
    data: { projectId: project.id, userId },
  });
}

async function setNewProjectDraft(website: string, description: string) {
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/projects",
    maxAge: 60 * 30,
  };
  cookieStore.set(NEW_PROJECT_WEBSITE_COOKIE, b64url(website.slice(0, 500)), options);
  cookieStore.set(NEW_PROJECT_DESCRIPTION_COOKIE, b64url(description.slice(0, 1_200)), options);
}

async function clearNewProjectDraft() {
  const cookieStore = await cookies();
  const expireOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/projects",
    maxAge: 0,
  };
  cookieStore.set(NEW_PROJECT_WEBSITE_COOKIE, "", expireOptions);
  cookieStore.set(NEW_PROJECT_DESCRIPTION_COOKIE, "", expireOptions);
}

function b64url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logOpenAIUsage } from "@/db/mutations/api-usage";
import {
  createProject,
  replaceProjectSuggestions,
  saveProjectOnboarding,
  setProjectOnboardingStatus,
} from "@/db/mutations/projects";
import {
  listProjectKeywordSuggestions,
  listProjectSubredditSuggestions,
  listProjectsForCurrentUser,
} from "@/db/queries/projects";
import { inngest } from "@/inngest/client";
import { getCurrentBillingPlan } from "@/modules/billing/current";
import { canCreateProject } from "@/modules/billing/limits";
import { requireUser } from "@/modules/auth/server";
import { analyzeCompanyWithAI, fetchWebsiteText } from "@/modules/onboarding/company-analyzer";
import { validateAccessibleWebsite } from "@/modules/onboarding/url-validation";
import { setCurrentProject } from "@/modules/projects/current";
import { generateProjectSuggestions, type CompetitorContext } from "@/modules/projects/suggestion-generator";
import type { ProjectDTO } from "@/db/schemas/domain";

const NEW_PROJECT_WEBSITE_COOKIE = "new_project_website";
const NEW_PROJECT_DESCRIPTION_COOKIE = "new_project_description";
const NEW_PROJECT_COMPETITORS_COOKIE = "new_project_competitors";

export async function createFirstProject(formData: FormData) {
  const user = await requireUser("/bootstrap");
  const existing = await listProjectsForCurrentUser();
  if (existing.length > 0) {
    redirect("/dashboard");
  }
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

export async function confirmNewProjectDescription(formData: FormData) {
  await requireUser("/projects/new");
  const description = String(formData.get("description") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  if (description) {
    const cookieStore = await cookies();
    cookieStore.set(NEW_PROJECT_DESCRIPTION_COOKIE, b64url(description.slice(0, 1_200)), {
      httpOnly: true, sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/projects", maxAge: 60 * 30,
    });
  }
  redirect(`/projects/new?analyzed=1&step=competitors${website ? `&website=${encodeURIComponent(website)}` : ""}`);
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
  const competitorUrls = formData
    .getAll("competitorUrl")
    .map((v) => String(v).trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!website || !description) {
    redirect(`/projects/new?error=${encodeURIComponent("Revisá el website y la descripción.")}`);
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

  // Scrape competitors in parallel (non-blocking — failures just reduce context quality)
  let competitorContexts: CompetitorContext[] = [];
  if (competitorUrls.length > 0) {
    try {
      const validated = await Promise.all(
        competitorUrls.map((url) => validateAccessibleWebsite(url).catch(() => null)),
      );
      competitorContexts = await Promise.all(
        validated.filter(Boolean).map(async (c) => ({
          name: c!.hostname.replace(/\.[a-z]{2,}$/i, "").replace(/[.-]/g, " "),
          websiteUrl: c!.url,
          websiteContent: await fetchWebsiteText(c!.url),
        })),
      );
    } catch {
      // non-critical — generate without competitors
    }
  }

  await setupProjectKeywordsAndTrigger(project, user.id, competitorContexts);
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

  await setupProjectKeywordsAndTrigger(project, userId);
  await setCurrentProject(project.id);
  redirect(`/dashboard?projectId=${project.id}`);
}

/**
 * Generates AI keyword/subreddit suggestions synchronously (same as signup flow),
 * saves them, marks onboarding complete, then fires Inngest events for the heavy
 * work (backfill + searchbox). This avoids depending on unsynced Inngest functions
 * for keyword generation while keeping scraping async.
 */
async function setupProjectKeywordsAndTrigger(project: ProjectDTO, userId: string, competitors: CompetitorContext[] = []) {
  try {
    const suggestions = await generateProjectSuggestions(project, competitors);

    await replaceProjectSuggestions({
      projectId: project.id,
      keywords: suggestions.keywords,
      subreddits: suggestions.subreddits,
    });

    try {
      await logOpenAIUsage({
        projectId: project.id,
        userId,
        operation: "project_onboarding_suggestions",
        model: suggestions.usage.model,
        inputTokens: suggestions.usage.inputTokens,
        outputTokens: suggestions.usage.outputTokens,
        metadata: {
          keyword_count: suggestions.keywords.length,
          subreddit_count: suggestions.subreddits.length,
        },
      });
    } catch {
      // non-critical
    }

    const [keywordSuggestions, subredditSuggestions] = await Promise.all([
      listProjectKeywordSuggestions(project.id),
      listProjectSubredditSuggestions(project.id),
    ]);

    await saveProjectOnboarding({
      projectId: project.id,
      acceptedKeywordSuggestionIds: keywordSuggestions.map((k) => k.id),
      acceptedSubredditSuggestionIds: subredditSuggestions.map((s) => s.id),
      customKeywords: [],
      customSubreddits: [],
    });
  } catch {
    // Keywords failed — mark completed anyway so dashboard loads, keywords can be added from settings
    await setProjectOnboardingStatus(project.id, "completed", null);
  }

  // Backfill (last 30 days of Reddit posts) + Searchbox (Google-ranked Reddit posts)
  await inngest.send([
    { name: "project/backfill.requested", data: { projectId: project.id } },
    { name: "project/searchbox.requested", data: { projectId: project.id } },
  ]);
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

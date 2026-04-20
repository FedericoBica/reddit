"use server";

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
} from "@/db/queries/projects";
import { requireUser } from "@/modules/auth/server";
import { analyzeCompanyWithAI } from "@/modules/onboarding/company-analyzer";
import { setCurrentProject } from "@/modules/projects/current";
import { generateProjectSuggestions } from "@/modules/projects/suggestion-generator";
import { validateAccessibleWebsite } from "@/modules/onboarding/url-validation";
import { cookies } from "next/headers";

const SIGNUP_COMPANY_WEBSITE_COOKIE = "signup_company_website";
const SIGNUP_COMPANY_DESCRIPTION_COOKIE = "signup_company_description";

export async function analyzeCompanyWebsite(formData: FormData) {
  await requireUser("/signup/company");

  const website = String(formData.get("website") ?? "");

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
    redirect(`/signup/company?error=${encodeURIComponent(errorMessage)}`);
  }

  await setSignupCompanyDraft(draftUrl, draftDescription);
  redirect("/signup/company?analyzed=1");
}

export async function resetCompanyWebsiteAnalysis() {
  await requireUser("/signup/company");
  await clearSignupCompanyDraft();
  redirect("/signup/company");
}

export async function createProjectFromCompanyProfile(formData: FormData) {
  const user = await requireUser("/signup/company");

  const website = String(formData.get("website") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  if (!description) {
    redirect(
      `/signup/company?analyzed=1&error=${encodeURIComponent("La descripción no puede estar vacía.")}`,
    );
  }

  let hostname = website;
  try {
    hostname = new URL(website).hostname.replace(/^www\./i, "");
  } catch {
    /* use raw */
  }

  let projectId = "";
  let errorMessage: string | null = null;

  try {
    const project = await createProject({
      name: hostname || "my-company",
      websiteUrl: website || null,
      valueProposition: description,
      region: null,
      primaryLanguage: "en",
      currencyCode: "USD",
    });
    projectId = project.id;
    await setCurrentProject(project.id);

    try {
      const suggestions = await generateProjectSuggestions(project);
      await replaceProjectSuggestions({
        projectId: project.id,
        keywords: suggestions.keywords,
        subreddits: suggestions.subreddits,
      });

      try {
        await logOpenAIUsage({
          projectId: project.id,
          userId: user.id,
          operation: "project_onboarding_suggestions",
          model: suggestions.usage.model,
          inputTokens: suggestions.usage.inputTokens,
          outputTokens: suggestions.usage.outputTokens,
          metadata: {
            keyword_count: suggestions.keywords.length,
            subreddit_count: suggestions.subreddits.length,
          },
        });
      } catch (usageLogError) {
        console.error("Failed to log signup suggestion usage", usageLogError);
      }

      const [keywordSuggestions, subredditSuggestions] = await Promise.all([
        listProjectKeywordSuggestions(project.id),
        listProjectSubredditSuggestions(project.id),
      ]);

      await saveProjectOnboarding({
        projectId: project.id,
        acceptedKeywordSuggestionIds: keywordSuggestions.map((keyword) => keyword.id),
        acceptedSubredditSuggestionIds: subredditSuggestions.map((subreddit) => subreddit.id),
        customKeywords: [],
        customSubreddits: [],
      });
    } catch (suggestionError) {
      console.error("Failed to auto-complete signup onboarding", suggestionError);
      await setProjectOnboardingStatus(
        project.id,
        "completed",
        suggestionError instanceof Error ? suggestionError.message : null,
      );
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "No pudimos crear el proyecto.";
  }

  if (errorMessage) {
    try {
      await setSignupCompanyDraft(website, description);
    } catch {
      /* ignore */
    }
    redirect(`/signup/company?analyzed=1&error=${encodeURIComponent(errorMessage)}`);
  }

  try {
    await clearSignupCompanyDraft();
  } catch {
    /* ignore */
  }
  redirect(`/signup/competitors?projectId=${projectId}`);
}

async function setSignupCompanyDraft(website: string, description: string) {
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/signup",
    maxAge: 60 * 30,
  };
  cookieStore.set(SIGNUP_COMPANY_WEBSITE_COOKIE, b64(website.slice(0, 500)), options);
  cookieStore.set(SIGNUP_COMPANY_DESCRIPTION_COOKIE, b64(description.slice(0, 1_200)), options);
}

async function clearSignupCompanyDraft() {
  const cookieStore = await cookies();
  const expireOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/signup",
    maxAge: 0,
  };
  cookieStore.set(SIGNUP_COMPANY_WEBSITE_COOKIE, "", expireOptions);
  cookieStore.set(SIGNUP_COMPANY_DESCRIPTION_COOKIE, "", expireOptions);
}

function b64(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

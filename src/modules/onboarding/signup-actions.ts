"use server";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logOpenAIUsage } from "@/db/mutations/api-usage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/server";
import { setCurrentBillingPlan } from "@/modules/billing/current";
import { parseBillingPlan, type BillingPlan } from "@/modules/billing/limits";
import { inngest } from "@/inngest/client";
import { analyzeCompanyWithAI, fetchWebsiteText } from "@/modules/onboarding/company-analyzer";
import { setCurrentProject } from "@/modules/projects/current";
import { generateProjectSuggestions, type CompetitorContext } from "@/modules/projects/suggestion-generator";
import { validateAccessibleWebsite } from "@/modules/onboarding/url-validation";
import { getProjectById } from "@/db/queries/projects";

const SIGNUP_COMPANY_WEBSITE_COOKIE = "signup_company_website";
const SIGNUP_COMPANY_DESCRIPTION_COOKIE = "signup_company_description";

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const emailQuery = email ? `?email=${encodeURIComponent(email)}` : "";

  if (!email || password.length < 8) {
    redirect(
      `/signup${emailQuery ? `${emailQuery}&` : "?"}error=${encodeURIComponent(
        "Ingresá email y una contraseña de al menos 8 caracteres.",
      )}`,
    );
  }

  if (confirmPassword && password !== confirmPassword) {
    redirect(
      `/signup?email=${encodeURIComponent(email)}&error=${encodeURIComponent(
        "Las contraseñas no coinciden.",
      )}`,
    );
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/signup/company")}`,
    },
  });

  if (error) {
    redirect(
      `/signup?email=${encodeURIComponent(email)}&error=${encodeURIComponent(error.message)}`,
    );
  }

  if (!data.session) {
    redirect(
      `/signup?email=${encodeURIComponent(email)}&notice=${encodeURIComponent(
        "Te enviamos un email de confirmación. Abrilo para continuar el signup.",
      )}`,
    );
  }

  redirect("/signup/company");
}

export async function signUpWithGoogle() {
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";
  const supabase = await createSupabaseServerClient();
  const next = "/signup/company";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.url) {
    redirect(
      `/signup?error=${encodeURIComponent("No pudimos iniciar Google OAuth.")}`,
    );
  }

  redirect(data.url);
}

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
  const website = String(formData.get("website") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!website || !description) {
    redirect(
      `/signup/company?error=${encodeURIComponent("Revisá el website y la descripción.")}`,
    );
  }

  let hostname = "";
  try {
    hostname = new URL(website).hostname.replace(/^www\./i, "");
  } catch {
    hostname = website.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
  }

  const project = await createProject({
    name: hostname || "ReddProwl project",
    websiteUrl: website,
    valueProposition: description,
    primaryLanguage: "en",
    currencyCode: "USD",
  });

  await setCurrentProject(project.id);
  await clearSignupCompanyDraft();

  redirect(`/signup/competitors?projectId=${project.id}`);
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

async function logSignupSuggestionUsage(input: {
  projectId: string;
  userId: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  keywordCount: number;
  subredditCount: number;
}) {
  await logOpenAIUsage({
    projectId: input.projectId,
    userId: input.userId,
    operation: "project_onboarding_suggestions",
    model: input.model,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    metadata: {
      keyword_count: input.keywordCount,
      subreddit_count: input.subredditCount,
    },
  });
}

export async function saveCompetitorsFromSignup(formData: FormData) {
  const user = await requireUser("/signup/competitors");

  const projectId = String(formData.get("projectId") ?? "");
  const urls = formData
    .getAll("competitorUrl")
    .map((entry) => String(entry).trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!projectId || urls.length === 0) {
    redirect(
      `/signup/competitors?projectId=${projectId}&error=${encodeURIComponent("Agregá al menos un competidor.")}`,
    );
  }

  let competitorError: string | null = null;
  let validatedCompetitors: { hostname: string; url: string }[] = [];

  try {
    validatedCompetitors = await Promise.all(urls.map((url) => validateAccessibleWebsite(url)));
    const supabase = await createClient();

    const { error } = await supabase.from("keywords").upsert(
      validatedCompetitors.map((competitor) => ({
        project_id: projectId,
        term: competitor.hostname,
        type: "competitor" as const,
        intent_category: "comparative" as const,
        is_active: true,
      })),
      { onConflict: "project_id,term", ignoreDuplicates: false },
    );

    if (error) throw new Error(error.message);
  } catch (error) {
    competitorError = error instanceof Error ? error.message : "Revisá las URLs de competidores.";
  }

  if (competitorError) {
    redirect(
      `/signup/competitors?projectId=${projectId}&error=${encodeURIComponent(competitorError)}`,
    );
  }

  // Scrape competitor websites + generate suggestions with full competitor context
  const project = await getProjectById(projectId);
  if (project) {
    try {
      const competitorContexts: CompetitorContext[] = await Promise.all(
        validatedCompetitors.map(async (c) => ({
          name: c.hostname.replace(/\.[a-z]{2,}$/i, "").replace(/[.-]/g, " "),
          websiteUrl: c.url,
          websiteContent: await fetchWebsiteText(c.url),
        })),
      );

      const suggestions = await generateProjectSuggestions(project, competitorContexts);
      await replaceProjectSuggestions({
        projectId,
        keywords: suggestions.keywords,
        subreddits: suggestions.subreddits,
      });

      try {
        await logSignupSuggestionUsage({
          projectId,
          userId: user.id,
          model: suggestions.usage.model,
          inputTokens: suggestions.usage.inputTokens,
          outputTokens: suggestions.usage.outputTokens,
          keywordCount: suggestions.keywords.length,
          subredditCount: suggestions.subreddits.length,
        });
      } catch {
        // non-critical
      }

      const [keywordSuggestions, subredditSuggestions] = await Promise.all([
        listProjectKeywordSuggestions(projectId),
        listProjectSubredditSuggestions(projectId),
      ]);

      await saveProjectOnboarding({
        projectId,
        acceptedKeywordSuggestionIds: keywordSuggestions.map((k) => k.id),
        acceptedSubredditSuggestionIds: subredditSuggestions.map((s) => s.id),
        customKeywords: [],
        customSubreddits: [],
      });
    } catch (err) {
      console.error("Failed to generate suggestions with competitors", err);
      await setProjectOnboardingStatus(projectId, "completed", null);
    }

    await inngest.send([
      { name: "project/backfill.requested", data: { projectId } },
      { name: "project/searchbox.requested", data: { projectId } },
    ]);
  }

  redirect(`/signup/value?projectId=${projectId}`);
}

export async function continueToPlan(formData: FormData) {
  await requireUser("/signup/value");
  const projectId = String(formData.get("projectId") ?? "");
  redirect(`/signup/plan?projectId=${projectId}`);
}

export async function choosePlanFromSignup(formData: FormData) {
  await requireUser("/signup/plan");

  const projectId = String(formData.get("projectId") ?? "");
  const plan = parseBillingPlan(String(formData.get("plan") ?? "")) ?? "growth";

  await setCurrentBillingPlan(plan as BillingPlan);

  if (projectId) {
    await inngest.send({
      name: "project/backfill.requested",
      data: { projectId },
    });
  }

  redirect(`/signup/loading?projectId=${projectId}`);
}

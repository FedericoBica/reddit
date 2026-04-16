"use server";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createProject } from "@/db/mutations/projects";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/server";
import { setCurrentBillingPlan } from "@/modules/billing/current";
import { parseBillingPlan, type BillingPlan } from "@/modules/billing/limits";
import { analyzeCompanyWithAI } from "@/modules/onboarding/company-analyzer";
import { setCurrentProject } from "@/modules/projects/current";
import { validateAccessibleWebsite } from "@/modules/onboarding/url-validation";

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

  if (password !== confirmPassword) {
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

export async function createProjectFromCompanyProfile(_formData: FormData) {
  redirect("/dashboard");
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

export async function saveCompetitorsFromSignup(formData: FormData) {
  await requireUser("/signup/competitors");

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

  try {
    const competitors = await Promise.all(urls.map((url) => validateAccessibleWebsite(url)));
    const supabase = await createClient();

    const { error } = await supabase.from("keywords").upsert(
      competitors.map((competitor) => ({
        project_id: projectId,
        term: competitor.hostname,
        type: "competitor" as const,
        intent_category: "comparative" as const,
        is_active: true,
      })),
      { onConflict: "project_id,term", ignoreDuplicates: false },
    );

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    competitorError = error instanceof Error ? error.message : "Revisá las URLs de competidores.";
  }

  if (competitorError) {
    redirect(
      `/signup/competitors?projectId=${projectId}&error=${encodeURIComponent(competitorError)}`,
    );
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
  redirect(`/signup/loading?projectId=${projectId}`);
}

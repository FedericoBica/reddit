"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logOpenAIUsage } from "@/db/mutations/api-usage";
import {
  claimProjectSuggestionGeneration,
  replaceProjectSuggestions,
  saveProjectOnboarding,
  setProjectOnboardingStatus,
} from "@/db/mutations/projects";
import { getProjectById } from "@/db/queries/projects";
import { requireUser } from "@/modules/auth/server";
import { setCurrentProject } from "@/modules/projects/current";
import { generateProjectSuggestions } from "@/modules/projects/suggestion-generator";

export async function generateInitialProjectSuggestions(projectId: string) {
  const user = await requireUser("/onboarding/project");
  const project = await claimProjectSuggestionGeneration(projectId);

  if (!project) {
    return;
  }

  try {
    const suggestions = await generateProjectSuggestions(project);
    const latestProject = await getProjectById(project.id);

    if (!latestProject || latestProject.onboarding_status === "completed") {
      return;
    }

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
      console.error("Failed to log onboarding suggestion usage", usageLogError);
    }

    await setProjectOnboardingStatus(project.id, "suggestions_ready", null);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown suggestion generation error";
    await setProjectOnboardingStatus(project.id, "suggestions_failed", message);
  }

  revalidatePath("/onboarding/project");
}

export async function retryInitialProjectSuggestions(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  await generateInitialProjectSuggestions(projectId);
}

export async function completeProjectOnboarding(formData: FormData) {
  await requireUser("/onboarding/project");

  const projectId = String(formData.get("projectId") ?? "");
  const project = await getProjectById(projectId);

  if (!project) {
    redirect("/bootstrap");
  }

  await saveProjectOnboarding({
    projectId: project.id,
    acceptedKeywordSuggestionIds: toStringArray(formData.getAll("keywordSuggestionIds")),
    acceptedSubredditSuggestionIds: toStringArray(formData.getAll("subredditSuggestionIds")),
    customKeywords: splitLines(formData.get("customKeywords")),
    customSubreddits: splitLines(formData.get("customSubreddits")),
  });

  await setCurrentProject(project.id);
  redirect(`/dashboard?projectId=${project.id}`);
}

function toStringArray(values: FormDataEntryValue[]) {
  return values.map((value) => String(value)).filter((value) => value.length > 0);
}

function splitLines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

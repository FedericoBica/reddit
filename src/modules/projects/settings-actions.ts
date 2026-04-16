"use server";

import { revalidatePath } from "next/cache";
import { updateProject } from "@/db/mutations/projects";
import {
  addKeyword,
  removeKeyword,
  toggleKeyword,
  addSubreddit,
  removeSubreddit,
  toggleSubreddit,
} from "@/db/mutations/settings";
import { requireUser } from "@/modules/auth/server";

export async function updateProjectFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");

  await updateProject(projectId, {
    name: String(formData.get("name") ?? "").trim() || undefined,
    websiteUrl: String(formData.get("websiteUrl") ?? "").trim() || undefined,
    valueProposition: String(formData.get("valueProposition") ?? "").trim() || undefined,
    tone: String(formData.get("tone") ?? "").trim() || undefined,
    region: String(formData.get("region") ?? "").trim() || undefined,
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function addKeywordFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const term = String(formData.get("term") ?? "").trim();

  if (!term) return;

  await addKeyword(projectId, term);
  revalidatePath("/settings");
}

export async function removeKeywordFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const keywordId = String(formData.get("keywordId") ?? "");

  await removeKeyword(projectId, keywordId);
  revalidatePath("/settings");
}

export async function toggleKeywordFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const keywordId = String(formData.get("keywordId") ?? "");
  const isActive = formData.get("isActive") === "true";

  await toggleKeyword(projectId, keywordId, isActive);
  revalidatePath("/settings");
}

export async function addSubredditFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return;

  await addSubreddit(projectId, name);
  revalidatePath("/settings");
}

export async function removeSubredditFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const subredditId = String(formData.get("subredditId") ?? "");

  await removeSubreddit(projectId, subredditId);
  revalidatePath("/settings");
}

export async function toggleSubredditFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const subredditId = String(formData.get("subredditId") ?? "");
  const isActive = formData.get("isActive") === "true";

  await toggleSubreddit(projectId, subredditId, isActive);
  revalidatePath("/settings");
}

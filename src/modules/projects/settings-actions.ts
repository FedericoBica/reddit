"use server";

import { revalidatePath } from "next/cache";
import { updateProject } from "@/db/mutations/projects";
import type { UpdateProjectInput } from "@/db/schemas/domain";
import {
  addKeyword,
  updateKeyword,
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
  const input: UpdateProjectInput = {};

  if (formData.has("name")) input.name = String(formData.get("name") ?? "").trim() || undefined;
  if (formData.has("websiteUrl")) input.websiteUrl = String(formData.get("websiteUrl") ?? "").trim() || null;
  if (formData.has("valueProposition")) input.valueProposition = String(formData.get("valueProposition") ?? "").trim() || null;
  if (formData.has("tone")) input.tone = String(formData.get("tone") ?? "").trim() || null;
  if (formData.has("region")) input.region = String(formData.get("region") ?? "").trim() || null;

  await updateProject(projectId, input);

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

export async function addCompetitorFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const term = String(formData.get("term") ?? "").trim();

  if (!term) return;

  await addKeyword(projectId, term, "competitor");
  revalidatePath("/settings");
}

export async function updateKeywordFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const keywordId = String(formData.get("keywordId") ?? "");
  const term = String(formData.get("term") ?? "").trim();

  if (!term) return;

  await updateKeyword(projectId, keywordId, term);
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

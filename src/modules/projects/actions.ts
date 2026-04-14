"use server";

import { redirect } from "next/navigation";
import { createProject } from "@/db/mutations/projects";
import { requireUser } from "@/modules/auth/server";
import { setCurrentProject } from "@/modules/projects/current";

export async function createFirstProject(formData: FormData) {
  await requireUser("/bootstrap");

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

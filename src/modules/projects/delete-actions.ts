"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteProject } from "@/db/mutations/projects";
import { listProjectsForCurrentUser } from "@/db/queries/projects";
import { requireUser } from "@/modules/auth/server";
import { clearCurrentProject, setCurrentProject } from "@/modules/projects/current";

export async function deleteProjectFromForm(formData: FormData) {
  await requireUser("/settings");

  const projectId = String(formData.get("projectId") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (!projectId) {
    redirect("/settings");
  }

  if (confirmation !== "DELETE") {
    redirect(`/settings?projectId=${projectId}&tab=general`);
  }

  await deleteProject(projectId);

  const remainingProjects = await listProjectsForCurrentUser();

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/mentions");
  revalidatePath("/opportunities");

  if (remainingProjects.length === 0) {
    await clearCurrentProject();
    redirect("/bootstrap");
  }

  await setCurrentProject(remainingProjects[0].id);
  redirect(`/dashboard?projectId=${remainingProjects[0].id}`);
}

import "server-only";

import { redirect } from "next/navigation";
import { getProjectById, listProjectsForCurrentUser } from "@/db/queries/projects";
import type { ProjectDTO } from "@/db/schemas/domain";

export async function redirectIfUserAlreadyHasProjects() {
  const projects = await listProjectsForCurrentUser();

  if (projects.length > 0) {
    redirect(`/dashboard?projectId=${projects[0].id}`);
  }
}

export async function getSignupProjectOrRedirect(
  projectId: string | null | undefined,
  redirectPath = "/signup/company",
): Promise<ProjectDTO> {
  if (!projectId) {
    redirect(redirectPath);
  }

  const project = await getProjectById(projectId);

  if (!project) {
    redirect(redirectPath);
  }

  return project;
}

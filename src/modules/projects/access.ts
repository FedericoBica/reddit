import "server-only";

import { redirect } from "next/navigation";
import { getProjectById } from "@/db/queries/projects";
import type { ProjectDTO } from "@/db/schemas/domain";

export async function requireProjectAccess(
  projectId: string,
  redirectTo = "/dashboard",
): Promise<ProjectDTO> {
  const project = await getProjectById(projectId);

  if (!project) {
    redirect(redirectTo);
  }

  return project;
}

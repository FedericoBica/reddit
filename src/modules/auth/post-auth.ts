import "server-only";

import { listProjectsForCurrentUser } from "@/db/queries/projects";
import { isCurrentUserAdmin } from "@/modules/auth/admin";

export async function resolvePostAuthPath(next: string) {
  if (next.startsWith("/signup")) {
    return next;
  }

  const projects = await listProjectsForCurrentUser();

  if (projects.length === 0) {
    if (await isCurrentUserAdmin()) return "/admin";
    return "/signup/company";
  }

  const currentProject = projects[0];

  if (currentProject.onboarding_status !== "completed") {
    return `/onboarding/project?projectId=${currentProject.id}`;
  }

  return next;
}

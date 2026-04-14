import "server-only";

import { cookies } from "next/headers";
import type { ProjectDTO } from "@/db/schemas/domain";
import { getProjectById, listProjectsForCurrentUser } from "@/db/queries/projects";

export const CURRENT_PROJECT_COOKIE = "rlr_current_project_id";

type CurrentProjectResult =
  | {
      status: "missing";
      projects: [];
      currentProject: null;
    }
  | {
      status: "invalid";
      projects: ProjectDTO[];
      currentProject: ProjectDTO;
      requestedProjectId: string;
    }
  | {
      status: "ready";
      projects: ProjectDTO[];
      currentProject: ProjectDTO;
    };

export async function resolveCurrentProject(
  requestedProjectId?: string | null,
): Promise<CurrentProjectResult> {
  const projects = await listProjectsForCurrentUser();

  if (projects.length === 0) {
    return {
      status: "missing",
      projects: [],
      currentProject: null,
    };
  }

  const cookieStore = await cookies();
  const cookieProjectId = cookieStore.get(CURRENT_PROJECT_COOKIE)?.value;
  const fallbackProject = projects[0];

  if (requestedProjectId) {
    const requestedProject = projects.find((project) => project.id === requestedProjectId);

    if (requestedProject) {
      return {
        status: "ready",
        projects,
        currentProject: requestedProject,
      };
    }

    const project = await getProjectById(requestedProjectId);

    if (project) {
      return {
        status: "ready",
        projects,
        currentProject: project,
      };
    }

    return {
      status: "invalid",
      projects,
      currentProject: fallbackProject,
      requestedProjectId,
    };
  }

  const projectFromList = projects.find((project) => project.id === cookieProjectId);

  if (projectFromList) {
    return {
      status: "ready",
      projects,
      currentProject: projectFromList,
    };
  }

  return {
    status: "ready",
    projects,
    currentProject: fallbackProject,
  };
}

export async function setCurrentProject(projectId: string) {
  const cookieStore = await cookies();

  cookieStore.set(CURRENT_PROJECT_COOKIE, projectId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

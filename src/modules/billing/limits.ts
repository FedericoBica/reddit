export type BillingPlan = "starter" | "growth" | "enterprise";

export type ProjectLimit = {
  plan: BillingPlan;
  label: string;
  maxProjects: number | null;
};

const PROJECT_LIMITS: Record<BillingPlan, ProjectLimit> = {
  starter: {
    plan: "starter",
    label: "Starter",
    maxProjects: 1,
  },
  growth: {
    plan: "growth",
    label: "Growth trial",
    maxProjects: 3,
  },
  enterprise: {
    plan: "enterprise",
    label: "Enterprise",
    maxProjects: null,
  },
};

export function getEffectiveProjectLimit(): ProjectLimit {
  return PROJECT_LIMITS.growth;
}

export function getProjectLimitForPlan(plan: BillingPlan | null | undefined): ProjectLimit {
  if (!plan) {
    return getEffectiveProjectLimit();
  }

  return PROJECT_LIMITS[plan] ?? getEffectiveProjectLimit();
}

export function parseBillingPlan(value: string | null | undefined): BillingPlan | null {
  if (value === "starter" || value === "growth" || value === "enterprise") {
    return value;
  }

  return null;
}

export function canCreateProject(projectCount: number, limit = getEffectiveProjectLimit()) {
  return limit.maxProjects === null || projectCount < limit.maxProjects;
}

export function formatProjectUsage(projectCount: number, limit = getEffectiveProjectLimit()) {
  if (limit.maxProjects === null) {
    return `${projectCount} proyectos`;
  }

  return `${projectCount}/${limit.maxProjects} proyectos`;
}

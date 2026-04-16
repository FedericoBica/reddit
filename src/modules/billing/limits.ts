export type BillingPlan = "starter" | "growth" | "enterprise";

export type ProjectLimit = {
  plan: BillingPlan;
  label: string;
  maxProjects: number | null;
  maxKeywords: number | null;
  maxCompetitors: number | null;
  scrapeIntervalHours: number;
  maxAiRepliesPerMonth: number | null;
  maxGhostwriterThreads: number | null;
  maxTeamMembers: number | null;
  maxRedditAccounts: number | null;
  integrations: {
    slack: boolean;
    telegram: boolean;
    webhooks: boolean;
  };
  accountProtection: boolean;
  battlecards: boolean;
};

const PROJECT_LIMITS: Record<BillingPlan, ProjectLimit> = {
  starter: {
    plan: "starter",
    label: "Starter",
    maxProjects: 1,
    maxKeywords: 10,
    maxCompetitors: 3,
    scrapeIntervalHours: 12,
    maxAiRepliesPerMonth: 100,
    maxGhostwriterThreads: 5,
    maxTeamMembers: 1,
    maxRedditAccounts: 1,
    integrations: {
      slack: false,
      telegram: false,
      webhooks: false,
    },
    accountProtection: true,
    battlecards: true,
  },
  growth: {
    plan: "growth",
    label: "Growth",
    maxProjects: 3,
    maxKeywords: 25,
    maxCompetitors: 6,
    scrapeIntervalHours: 4,
    maxAiRepliesPerMonth: 400,
    maxGhostwriterThreads: 20,
    maxTeamMembers: 3,
    maxRedditAccounts: 2,
    integrations: {
      slack: true,
      telegram: true,
      webhooks: true,
    },
    accountProtection: true,
    battlecards: true,
  },
  enterprise: {
    plan: "enterprise",
    label: "Enterprise",
    maxProjects: 10,
    maxKeywords: 50,
    maxCompetitors: 10,
    scrapeIntervalHours: 1,
    maxAiRepliesPerMonth: 1000,
    maxGhostwriterThreads: null,
    maxTeamMembers: 5,
    maxRedditAccounts: null,
    integrations: {
      slack: true,
      telegram: true,
      webhooks: true,
    },
    accountProtection: true,
    battlecards: true,
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

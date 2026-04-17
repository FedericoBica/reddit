export type BillingPlan = "startup" | "growth" | "professional";

export type KeywordSearchTimeWindow = "hour" | "day" | "week" | "month" | "year" | "all";

export type ProjectLimit = {
  plan: BillingPlan;
  label: string;
  maxProjects: number | null;
  maxKeywords: number | null;
  maxCompetitors: number | null;
  scrapeIntervalHours: number;
  keywordSearchTimeWindow: KeywordSearchTimeWindow;
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
  startup: {
    plan: "startup",
    label: "Startup",
    maxProjects: 1,
    maxKeywords: 20,
    maxCompetitors: 3,
    scrapeIntervalHours: 168,
    keywordSearchTimeWindow: "week",
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
    maxProjects: 2,
    maxKeywords: 40,
    maxCompetitors: 6,
    scrapeIntervalHours: 24,
    keywordSearchTimeWindow: "day",
    maxAiRepliesPerMonth: 300,
    maxGhostwriterThreads: 15,
    maxTeamMembers: 2,
    maxRedditAccounts: 2,
    integrations: {
      slack: false,
      telegram: true,
      webhooks: false,
    },
    accountProtection: true,
    battlecards: true,
  },
  professional: {
    plan: "professional",
    label: "Professional",
    maxProjects: 3,
    maxKeywords: 60,
    maxCompetitors: 8,
    scrapeIntervalHours: 24,
    keywordSearchTimeWindow: "day",
    maxAiRepliesPerMonth: 500,
    maxGhostwriterThreads: null,
    maxTeamMembers: 3,
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
  return PROJECT_LIMITS.startup;
}

export function getProjectLimitForPlan(plan: BillingPlan | null | undefined): ProjectLimit {
  if (!plan) {
    return getEffectiveProjectLimit();
  }

  return PROJECT_LIMITS[plan] ?? getEffectiveProjectLimit();
}

export function parseBillingPlan(value: string | null | undefined): BillingPlan | null {
  if (value === "startup" || value === "growth" || value === "professional") {
    return value;
  }

  // backwards compat with old plan names
  if (value === "starter") return "startup";
  if (value === "enterprise") return "professional";

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

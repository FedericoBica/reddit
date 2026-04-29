export type BillingPlan = "startup" | "growth" | "professional";

export type KeywordSearchTimeWindow = "hour" | "day" | "week" | "month" | "year" | "all";

export type ProjectLimit = {
  plan: BillingPlan;
  label: string;
  maxKeywords: number | null;
  maxXKeywords: number | null;
  maxCompetitors: number | null;
  scrapeIntervalHours: number;
  keywordSearchTimeWindow: KeywordSearchTimeWindow;
  maxPostsPerKeyword: number;
  maxCommentsPerKeyword: number;
  maxAiRepliesPerMonth: number | null;
  maxGhostwriterThreads: number | null;
  maxTeamMembers: number | null;
  maxRedditAccounts: number | null;
  xEnabled: boolean;
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
    maxKeywords: 10,
    maxXKeywords: null,
    maxCompetitors: 3,
    scrapeIntervalHours: 168,
    keywordSearchTimeWindow: "week",
    maxPostsPerKeyword: 25,
    maxCommentsPerKeyword: 25,
    maxAiRepliesPerMonth: 100,
    maxGhostwriterThreads: 5,
    maxTeamMembers: 1,
    maxRedditAccounts: 1,
    xEnabled: false,
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
    maxKeywords: 20,
    maxXKeywords: 10,
    maxCompetitors: 6,
    scrapeIntervalHours: 24,
    keywordSearchTimeWindow: "day",
    maxPostsPerKeyword: 10,
    maxCommentsPerKeyword: 13,
    maxAiRepliesPerMonth: 300,
    maxGhostwriterThreads: 15,
    maxTeamMembers: 2,
    maxRedditAccounts: 2,
    xEnabled: false,
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
    maxKeywords: 30,
    maxXKeywords: 20,
    maxCompetitors: 8,
    scrapeIntervalHours: 24,
    keywordSearchTimeWindow: "day",
    maxPostsPerKeyword: 10,
    maxCommentsPerKeyword: 13,
    maxAiRepliesPerMonth: 500,
    maxGhostwriterThreads: null,
    maxTeamMembers: 3,
    maxRedditAccounts: null,
    xEnabled: false,
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


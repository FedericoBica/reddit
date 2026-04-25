import type {
  DmCampaignDTO,
  DmCampaignType,
  DmContactDTO,
  DmContactStatus,
} from "@/db/schemas/domain";

type SeedLeadCandidate = {
  id: string;
  author: string | null;
};

type ExistingContactSeedState = {
  reddit_username: string | null;
  status: DmContactStatus;
};

const OUTCOME_TRANSITIONS: Partial<Record<DmContactStatus, DmContactStatus[]>> = {
  sent: ["replied", "lost"],
  replied: ["interested", "lost"],
  interested: ["won", "lost"],
};

const DEFAULT_MESSAGE_VARIANTS: Record<DmCampaignType, string[]> = {
  lead: [
    "Hey {{username}}, saw your post and thought I'd reach out.",
    "Hi {{username}}, your post caught my attention so I wanted to send a quick note.",
    "Hey {{username}}, not sure if this is relevant, but I thought I'd message you.",
  ],
  thread: [
    "Hey {{username}}, saw your comment and wanted to reach out.",
    "Hi {{username}}, came across your comment and thought this might be relevant.",
    "Hey {{username}}, your comment stood out so I wanted to send a quick note.",
  ],
  subreddit: [
    "Hey {{username}}, saw your post in {{subreddit}} and wanted to reach out.",
    "Hi {{username}}, came across your post in {{subreddit}} and thought this might be relevant.",
    "Hey {{username}}, not sure if this is a fit, but I wanted to send a quick note after seeing your post in {{subreddit}}.",
  ],
};

const PLACEHOLDER_TOKEN_PREFIX = "__REDDPROWL_TEMPLATE_TOKEN_";

export function filterSeedableLeadCandidates(
  leads: SeedLeadCandidate[],
  existingContacts: ExistingContactSeedState[],
): SeedLeadCandidate[] {
  const alreadyContacted = new Set(
    existingContacts
      .filter((contact) => contact.reddit_username && contact.status !== "queued")
      .map((contact) => contact.reddit_username),
  );
  const alreadyQueued = new Set(
    existingContacts
      .filter((contact) => contact.reddit_username && contact.status === "queued")
      .map((contact) => contact.reddit_username),
  );

  return leads.filter((lead) => {
    if (!lead.author) return false;
    return !alreadyContacted.has(lead.author) && !alreadyQueued.has(lead.author);
  });
}

export function interpolateDmMessageTemplate(
  template: string,
  contact: Pick<DmContactDTO, "reddit_username">,
  context?: { subreddit?: string | null; postTitle?: string | null },
): string {
  return template
    .replace(/\{\{username\}\}/gi, contact.reddit_username)
    .replace(/\{\{subreddit\}\}/gi, context?.subreddit?.trim() ?? "")
    .replace(/\{\{post_title\}\}/gi, context?.postTitle?.trim() ?? "");
}

function normalizeMessageVariant(value: string): string {
  return value.trim().replace(/\r\n/g, "\n");
}

function parseMessageVariants(sourceConfig: Record<string, unknown> | null | undefined): string[] {
  const variants = sourceConfig?.messageVariants;
  if (!Array.isArray(variants)) return [];

  return variants
    .filter((variant): variant is string => typeof variant === "string")
    .map(normalizeMessageVariant)
    .filter(Boolean);
}

function protectTemplateTokens(template: string): {
  protectedTemplate: string;
  restore: (value: string) => string;
} {
  const tokens: string[] = [];
  const protectedTemplate = template.replace(/\{\{[^{}]+\}\}/g, (match) => {
    const token = `${PLACEHOLDER_TOKEN_PREFIX}${tokens.length}__`;
    tokens.push(match);
    return token;
  });

  return {
    protectedTemplate,
    restore: (value: string) =>
      value.replace(new RegExp(`${PLACEHOLDER_TOKEN_PREFIX}(\\d+)__`, "g"), (_match, index) => {
        const resolved = tokens[Number(index)];
        return resolved ?? "";
      }),
  };
}

function encodeAsWholeMessageSpintax(variants: string[]): string {
  return `{${variants.join("|")}}`;
}

function hasSpintax(template: string): boolean {
  const { protectedTemplate } = protectTemplateTokens(template);
  return /\{[^{}|]+(?:\|[^{}|]+)+\}/.test(protectedTemplate);
}

function parseMessageSpintax(sourceConfig: Record<string, unknown> | null | undefined): string | null {
  const spintax = sourceConfig?.messageSpintax;
  return typeof spintax === "string" && spintax.trim() ? normalizeMessageVariant(spintax) : null;
}

function buildDefaultMessageVariants(
  type: DmCampaignType,
  messageTemplate: string,
  sourceConfig?: Record<string, unknown> | null,
): string[] {
  const primary = normalizeMessageVariant(messageTemplate);
  const configured = parseMessageVariants(sourceConfig);
  const defaults = DEFAULT_MESSAGE_VARIANTS[type];
  const variants = primary ? [primary] : [];

  for (const variant of configured) {
    if (!variants.some((entry) => entry.toLowerCase() === variant.toLowerCase())) {
      variants.push(variant);
    }
  }

  for (const variant of defaults) {
    if (!variants.some((entry) => entry.toLowerCase() === variant.toLowerCase())) {
      variants.push(variant);
    }
    if (variants.length >= 3) break;
  }

  return variants.slice(0, 3);
}

export function buildCampaignMessageSpintax(
  type: DmCampaignType,
  messageTemplate: string,
  sourceConfig?: Record<string, unknown> | null,
): string {
  const configuredSpintax = parseMessageSpintax(sourceConfig);
  if (configuredSpintax) return configuredSpintax;

  const primary = normalizeMessageVariant(messageTemplate);
  if (primary && hasSpintax(primary)) return primary;

  const legacyVariants = parseMessageVariants(sourceConfig);
  if (legacyVariants.length > 0) {
    return encodeAsWholeMessageSpintax(legacyVariants.slice(0, 3));
  }

  const variants = buildDefaultMessageVariants(type, messageTemplate, sourceConfig);
  if (variants.length <= 1) return variants[0] ?? primary;
  return encodeAsWholeMessageSpintax(variants);
}

export function buildCampaignMessageVariants(
  type: DmCampaignType,
  messageTemplate: string,
  sourceConfig?: Record<string, unknown> | null,
): string[] {
  const spintax = buildCampaignMessageSpintax(type, messageTemplate, sourceConfig);
  const previews = new Set<string>();

  for (let index = 0; index < 3; index += 1) {
    previews.add(expandSpintax(spintax, `preview-${index}`));
  }

  return [...previews];
}

export function attachCampaignMessageSpintax(
  type: DmCampaignType,
  sourceConfig: Record<string, unknown> | null | undefined,
  messageTemplate: string,
): Record<string, unknown> {
  const messageSpintax = buildCampaignMessageSpintax(type, messageTemplate, sourceConfig);
  return {
    ...(sourceConfig ?? {}),
    messageSpintax,
  };
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function expandSpintax(template: string, seed: string): string {
  const normalized = normalizeMessageVariant(template);
  const { protectedTemplate, restore } = protectTemplateTokens(normalized);
  let value = protectedTemplate;
  let iteration = 0;

  while (/\{[^{}]+\}/.test(value)) {
    value = value.replace(/\{([^{}]+)\}/g, (match, inner, offset) => {
      if (!inner.includes("|")) return match;

      const options = inner
        .split("|")
        .map((option: string) => option.trim())
        .filter(Boolean);

      if (options.length === 0) return "";

      const optionIndex = hashSeed(`${seed}:${iteration}:${offset}:${inner}`) % options.length;
      return options[optionIndex];
    });
    iteration += 1;
  }

  return restore(value);
}

export function selectCampaignMessageVariant(
  type: DmCampaignType,
  messageTemplate: string,
  sourceConfig: Record<string, unknown> | null | undefined,
  seed: string,
): string {
  const spintax = buildCampaignMessageSpintax(type, messageTemplate, sourceConfig);
  return expandSpintax(spintax, seed);
}

export function resolveCampaignSubreddit(sourceConfig: Record<string, unknown> | null | undefined): string {
  const subreddit = sourceConfig?.subreddit;
  return typeof subreddit === "string" ? subreddit : "";
}

export function resolveCampaignPostTitle(sourceConfig: Record<string, unknown> | null | undefined): string {
  const postTitle = sourceConfig?.postTitle;
  return typeof postTitle === "string" ? postTitle : "";
}

export function getOutcomeTransitions(status: DmContactStatus): DmContactStatus[] {
  return OUTCOME_TRANSITIONS[status] ?? [];
}

export function computeCrmStats(
  contacts: DmContactDTO[],
  campaigns: DmCampaignDTO[],
): {
  byStatus: Record<DmContactStatus, number>;
  responseRate: number;
} {
  const byStatus: Record<DmContactStatus, number> = {
    queued: 0,
    sent: 0,
    replied: 0,
    interested: 0,
    won: 0,
    lost: 0,
  };

  for (const contact of contacts) {
    byStatus[contact.status] += 1;
  }

  const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.sent_count, 0);
  const totalReplies = campaigns.reduce((sum, campaign) => sum + campaign.reply_count, 0);

  return {
    byStatus,
    responseRate: totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0,
  };
}

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

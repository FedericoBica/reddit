import type {
  DmCampaignDTO,
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
): string {
  return template
    .replace(/\{\{username\}\}/gi, contact.reddit_username)
    .replace(/\{\{subreddit\}\}/gi, "");
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

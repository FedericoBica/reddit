import type { BrandMentionDTO, BrandMentionSentiment, KeywordDTO, LeadDTO } from "@/db/schemas/domain";
export {
  formatDateWithCopy as formatDate,
  formatRelativeWithCopy as formatRelative,
  formatRelativeAgeWithCopy as formatAge,
} from "@/lib/date-format";

export type FeedType = "all" | "opportunities" | "mentions" | "x";

export type FeedItem =
  | { kind: "opportunity"; data: LeadDTO; sortKey: number }
  | { kind: "mention"; data: BrandMentionDTO; sortKey: number };

export function parseFeedType(value: string | undefined): FeedType {
  if (value === "opportunities" || value === "mentions" || value === "x") return value;
  return "all";
}

export function parseSentiment(value: string | undefined): BrandMentionSentiment | "all" {
  if (value === "positive" || value === "negative" || value === "neutral") return value;
  return "all";
}

export function resolveTarget(
  target: string | undefined,
  companyName: string,
  competitors: KeywordDTO[],
): string {
  if (!target || target === "all") return "all";
  if (target === companyName) return companyName;
  if (competitors.some((c) => c.term === target)) return target;
  return "all";
}

export function filterByType(items: FeedItem[], feedType: FeedType): FeedItem[] {
  if (feedType === "opportunities") return items.filter((i) => i.kind === "opportunity");
  if (feedType === "mentions") return items.filter((i) => i.kind === "mention");
  return items;
}

export function filterByTarget(
  mentions: BrandMentionDTO[],
  target: string,
  companyName: string,
): BrandMentionDTO[] {
  if (target === "all") return mentions;
  if (target === companyName) return mentions.filter((m) => m.target_type === "company");
  return mentions.filter((m) => m.target_label === target);
}

export function filterBySentiment(
  mentions: BrandMentionDTO[],
  sentiment: BrandMentionSentiment | "all",
): BrandMentionDTO[] {
  if (sentiment === "all") return mentions;
  return mentions.filter((m) => m.sentiment === sentiment);
}

export function sortMentions(mentions: BrandMentionDTO[], sort: string): BrandMentionDTO[] {
  return [...mentions].sort((a, b) =>
    sort === "recent"
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : (b.num_comments ?? 0) - (a.num_comments ?? 0),
  );
}

export function computeSentimentStats(mentions: BrandMentionDTO[]) {
  return mentions.reduce(
    (acc, m) => { acc.all++; acc[m.sentiment] = (acc[m.sentiment] ?? 0) + 1; return acc; },
    { all: 0, positive: 0, neutral: 0, negative: 0 } as Record<string, number>,
  );
}

export function buildFilterBase({
  projectId,
  feedType,
  target,
  sentiment,
  sort,
}: {
  projectId: string;
  feedType: FeedType;
  target: string;
  sentiment: BrandMentionSentiment | "all";
  sort: string;
}): string {
  const p = new URLSearchParams({ projectId });
  if (feedType !== "all") p.set("type", feedType);
  if (feedType === "mentions") {
    if (target !== "all") p.set("target", target);
    if (sentiment !== "all") p.set("sentiment", sentiment);
    if (sort !== "relevant") p.set("sort", sort);
  }
  return p.toString();
}

export function buildMentionHref({
  projectId,
  target,
  sentiment,
  sort,
  itemId,
}: {
  projectId: string;
  target?: string;
  sentiment?: string;
  sort?: string;
  itemId?: string;
}): string {
  const p = new URLSearchParams({ projectId, type: "mentions" });
  if (target) p.set("target", target);
  if (sentiment) p.set("sentiment", sentiment);
  if (sort) p.set("sort", sort);
  if (itemId) { p.set("itemId", itemId); p.set("itemType", "mention"); }
  return `/feed?${p.toString()}`;
}

export function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

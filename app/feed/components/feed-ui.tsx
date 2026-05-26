import type { BrandMentionSentiment } from "@/db/schemas/domain";
import type { FeedType } from "../feed-utils";
import { formatDate } from "../feed-utils";

export const COMPETITOR_COLORS = ["#4F46E5", "#059669", "#D97706", "#0EA5E9", "#7C3AED"];

export function TypeDot({ kind }: { kind: "opportunity" | "mention" }) {
  return (
    <span
      className="opportunity-dot"
      style={{ background: kind === "opportunity" ? "#FF4500" : "#7C7C83" }}
    />
  );
}

export function TargetBadge({ type, label }: { type: string; label: string }) {
  const isCompany = type === "company";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 800,
        padding: "2px 7px",
        borderRadius: 5,
        background: isCompany ? "#FFF3EC" : "#F3F4F6",
        color: isCompany ? "#FF4500" : "#7C7C83",
        border: isCompany ? "1px solid rgba(224,112,0,0.2)" : "1px solid #E5E7EB",
      }}
    >
      {label}
    </span>
  );
}

export function getSentimentConfig(copy: Record<string, string>): Record<BrandMentionSentiment, { label: string; color: string; bg: string }> {
  return {
    positive: { label: copy.positive, color: "#059669", bg: "#ECFDF5" },
    negative: { label: copy.negative, color: "#DC2626", bg: "#FEF2F2" },
    neutral: { label: copy.neutral, color: "#7C7C83", bg: "#F8F8F7" },
  };
}

export function SentimentPill({ sentiment, copy }: { sentiment: BrandMentionSentiment; copy: Record<string, string> }) {
  const cfg = getSentimentConfig(copy)[sentiment];
  return (
    <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6, color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

export function StatusPill({ status, copy }: { status: string; copy: Record<string, string> }) {
  const styles: Record<string, { bg: string; color: string }> = {
    new:        { bg: "#FFF3EC", color: "#E03D00" },
    replied:    { bg: "#DEF2E2", color: "#46A758" },
    irrelevant: { bg: "#EDEFF1", color: "#7C7C83" },
  };
  const s = styles[status] ?? styles.irrelevant;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 7, fontSize: 11, fontWeight: 800, background: s.bg, color: s.color }}>
      {status === "new" ? copy.statusNew : status === "replied" ? copy.statusReplied.replace("✓ ", "") : copy.statusIrrelevant}
    </span>
  );
}

export function EmptyFeed({
  feedType,
  lastScrapedAt,
  copy,
}: {
  feedType: FeedType;
  lastScrapedAt: string | null;
  copy: Record<string, string>;
}) {
  return (
    <div className="empty-state">
      <p className="section-title">
        {feedType === "mentions" ? copy.noMentions : copy.noLeads}
      </p>
      <p className="section-copy" style={{ maxWidth: 480, margin: "10px auto 0" }}>
        {feedType === "mentions"
          ? copy.adjustFilters
          : lastScrapedAt
          ? `${copy.lastScan} ${formatDate(lastScrapedAt, copy)}. ${copy.newPostsAppear}`
          : copy.scraperNotRun}
      </p>
    </div>
  );
}

export function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ marginLeft: 2, opacity: 0.5 }}>
      <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

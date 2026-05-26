import Link from "next/link";
import type { BrandMentionDTO, BrandMentionSentiment } from "@/db/schemas/domain";
import { toRedditUrl } from "@/lib/utils";
import { formatRelative, formatDate } from "../feed-utils";
import { COMPETITOR_COLORS, getSentimentConfig, SentimentPill, TargetBadge } from "./feed-ui";

const SENTIMENT_SUMMARY_COLOR: Record<BrandMentionSentiment, string> = {
  positive: "#059669",
  neutral:  "#D97706",
  negative: "#DC2626",
};

function highlightMention(text: string, term: string): React.ReactNode {
  if (!term.trim()) return text;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark
        key={i}
        style={{
          background: "rgba(255,69,0,0.10)",
          color: "#C04A00",
          textDecoration: "underline",
          textDecorationColor: "rgba(255,69,0,0.5)",
          borderRadius: 2,
          padding: "0 1px",
          fontStyle: "normal",
        }}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function MentionCard({ mention, active, href, copy }: { mention: BrandMentionDTO; active: boolean; href: string; copy: Record<string, string> }) {
  const isUnread = mention.opened_at === null;
  const cfg = getSentimentConfig(copy)[mention.sentiment];
  const summaryColor = SENTIMENT_SUMMARY_COLOR[mention.sentiment];
  const redditUrl = mention.permalink ? toRedditUrl(mention.permalink) : null;
  const displayUrl = redditUrl
    ? redditUrl.length > 62 ? `${redditUrl.slice(0, 59)}...` : redditUrl
    : null;
  const bodyText = mention.body
    ? (mention.body.length > 320 ? `${mention.body.slice(0, 317)}…` : mention.body)
    : null;

  return (
    <Link
      href={href}
      className={`opportunity-card mc-card${active ? " opportunity-card-active" : ""}`}
      style={isUnread && !active ? { borderLeftColor: "#4F46E5" } : undefined}
    >
      {/* Header: subreddit · date · comments | sentiment pill */}
      <div className="mc-header">
        <div className="mc-meta">
          <span className="mc-subreddit">r/{mention.subreddit}</span>
          {mention.posted_at && (
            <>
              <span className="mc-sep">·</span>
              <span>{formatRelative(mention.posted_at, copy)}</span>
            </>
          )}
          {mention.num_comments != null && (
            <>
              <span className="mc-sep">·</span>
              <span>{mention.num_comments} {copy.comments}</span>
            </>
          )}
        </div>
        <SentimentPill sentiment={mention.sentiment} copy={copy} />
      </div>

      {/* Thread title */}
      <h2 className="mc-title">{mention.title}</h2>

      {/* Reddit URL */}
      {displayUrl && <p className="mc-url">{displayUrl}</p>}

      <div className="mc-divider" />

      {/* Comment block — contained box */}
      {bodyText && (
        <div style={{ padding: "10px 14px 10px 16px" }}>
          <div
            style={{
              background: "#F8F9FA",
              border: "1px solid #E8EAED",
              borderRadius: 8,
              padding: "10px 12px",
              display: "grid",
              gap: 8,
            }}
          >
            {/* Author row */}
            <div className="mc-author-row">
              <div className="mc-avatar-circle">
                <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="mc-author">{mention.author ?? copy.unknownAuthor}</span>
              <span className="mc-author-date">{mention.posted_at ? formatDate(mention.posted_at, copy) : ""}</span>
            </div>

            {/* Body with highlighted mention */}
            <p className="mc-body">
              {highlightMention(bodyText, mention.target_label)}
            </p>

            {/* Target badge */}
            <div className="mc-tags">
              <TargetBadge type={mention.target_type} label={mention.target_label} />
            </div>

            {/* Footer: sentiment + view link */}
            <div className="mc-comment-footer">
              <span className="mc-sent-label" style={{ color: cfg.color }}>● {cfg.label}</span>
              {redditUrl && <span className="mc-view">{copy.viewOnRedditShort}</span>}
            </div>
          </div>
        </div>
      )}

      {/* AI summary — colored by sentiment */}
      {mention.summary && (
        <p
          className="mc-summary"
          style={{ color: summaryColor, fontWeight: 600 }}
        >
          {mention.summary}
        </p>
      )}
    </Link>
  );
}

export { COMPETITOR_COLORS };

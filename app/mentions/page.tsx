import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { RedditComments } from "@/app/components/reddit-comments";
import { MentionReplyGenerator } from "@/app/mentions/mention-reply-generator";
import { MentionTargetSwitcher, type MentionTargetOption } from "@/app/mentions/mention-target-switcher";
import { listBrandMentions } from "@/db/queries/brand-mentions";
import { listProjectLeads } from "@/db/queries/leads";
import { listProjectKeywords } from "@/db/queries/settings";
import type { BrandMentionDTO, BrandMentionSentiment, KeywordDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import { toRedditUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Mentions",
};

const PAGE_SIZE = 8;

type MentionsPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    mentionId?: string;
    target?: string;
    sentiment?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function MentionsPage({ searchParams }: MentionsPageProps) {
  const user = await requireUser("/mentions");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject } = projectState;

  const [recentLeads, keywords, allMentions] = await Promise.all([
    listProjectLeads({ projectId: currentProject.id, limit: 50, page: 0 }),
    listProjectKeywords(currentProject.id),
    listBrandMentions({ projectId: currentProject.id }),
  ]);

  const newLeadsCount = recentLeads.filter((lead) => lead.status === "new").length;
  const competitors = keywords.filter((keyword) => keyword.type === "competitor" && keyword.is_active);
  const selectedTarget = resolveTarget(params?.target, currentProject.name, competitors);
  const selectedSentiment = parseSentiment(params?.sentiment);
  const selectedSort = params?.sort === "recent" ? "recent" : "relevant";

  const targetMentions = filterByTarget(allMentions, selectedTarget, currentProject.name);
  const filteredMentions = filterBySentiment(targetMentions, selectedSentiment);
  const sortedMentions = sortMentions(filteredMentions, selectedSort);
  const sentimentStats = computeSentimentStats(targetMentions);
  const targetOptions = buildTargetOptions(currentProject.id, currentProject.name, competitors, selectedTarget);

  const requestedId = params?.mentionId;
  const selectedMention = requestedId
    ? sortedMentions.find((mention) => mention.id === requestedId) ?? sortedMentions[0] ?? null
    : sortedMentions[0] ?? null;

  const pageFromParam = Math.max(0, parseInt(params?.page ?? "0") || 0);
  const selectedIndex = selectedMention ? sortedMentions.findIndex((mention) => mention.id === selectedMention.id) : -1;
  const autoPage = selectedIndex >= 0 ? Math.floor(selectedIndex / PAGE_SIZE) : 0;
  const currentPage = params?.mentionId && !params?.page
    ? autoPage
    : Math.min(pageFromParam, Math.max(0, Math.ceil(sortedMentions.length / PAGE_SIZE) - 1));
  const totalPages = Math.max(1, Math.ceil(sortedMentions.length / PAGE_SIZE));
  const paginatedMentions = sortedMentions.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return (
    <DashboardShell
      user={user}
      currentProject={currentProject}
      newLeadsCount={newLeadsCount}
    >
      <section className="searchbox-workspace">
        <header className="ds-topbar">
          <div className="ds-topbar-left">
            <div className="ds-topbar-icon">◎</div>
            <div className="ds-topbar-titles">
              <h1 className="ds-topbar-title">Brand <em>Mentions</em></h1>
              <div className="ds-topbar-sub">
                <span><strong>{sortedMentions.length}</strong> filtered posts</span>
                <span className="ds-topbar-sep">·</span>
                <span>{selectedTarget === "all" ? "brand + competitors" : selectedTarget}</span>
              </div>
            </div>
          </div>
          <MentionCountBadge count={allMentions.length} />
        </header>

        {allMentions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="searchbox-body">
            <section className="opportunity-column" aria-label="Brand mentions">
              <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid #DAE0E6", display: "grid", gap: 10 }}>
                <div style={{ maxWidth: 320 }}>
                  <MentionTargetSwitcher options={targetOptions} />
                </div>
                <SortControl
                  projectId={currentProject.id}
                  target={selectedTarget}
                  sentiment={selectedSentiment}
                  selectedSort={selectedSort}
                />
                <SentimentBar
                  projectId={currentProject.id}
                  target={selectedTarget}
                  selectedSentiment={selectedSentiment}
                  selectedSort={selectedSort}
                  mentionId={selectedMention?.id}
                  stats={sentimentStats}
                />
              </div>

              <div className="opportunity-list">
                {sortedMentions.length > 0 ? (
                  paginatedMentions.map((mention) => (
                    <MentionCard
                      key={mention.id}
                      mention={mention}
                      active={mention.id === selectedMention?.id}
                      href={buildHref({
                        projectId: currentProject.id,
                        mentionId: mention.id,
                        target: selectedTarget,
                        sentiment: selectedSentiment === "all" ? undefined : selectedSentiment,
                        sort: selectedSort === "recent" ? "recent" : undefined,
                      })}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <p className="section-title">No mentions with this filter</p>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div style={{ borderTop: "1px solid #DAE0E6", padding: "10px 14px", display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
                  {currentPage > 0 ? (
                    <Link
                      href={buildHref({
                        projectId: currentProject.id,
                        target: selectedTarget,
                        sentiment: selectedSentiment === "all" ? undefined : selectedSentiment,
                        sort: selectedSort === "recent" ? "recent" : undefined,
                        page: currentPage - 1,
                      })}
                      style={{ fontSize: 11, fontWeight: 700, color: "#FF4500", textDecoration: "none", padding: "2px 8px", borderRadius: 99, border: "1px solid #FF4500" }}
                    >
                      ←
                    </Link>
                  ) : <span style={{ width: 30 }} />}
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#7C7C83" }}>{currentPage + 1} / {totalPages}</span>
                  {currentPage < totalPages - 1 ? (
                    <Link
                      href={buildHref({
                        projectId: currentProject.id,
                        target: selectedTarget,
                        sentiment: selectedSentiment === "all" ? undefined : selectedSentiment,
                        sort: selectedSort === "recent" ? "recent" : undefined,
                        page: currentPage + 1,
                      })}
                      style={{ fontSize: 11, fontWeight: 700, color: "#FF4500", textDecoration: "none", padding: "2px 8px", borderRadius: 99, border: "1px solid #FF4500" }}
                    >
                      →
                    </Link>
                  ) : <span style={{ width: 30 }} />}
                </div>
              )}
            </section>

            <MentionDetail mention={selectedMention} projectId={currentProject.id} />
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

function MentionCard({
  mention,
  active,
  href,
}: {
  mention: BrandMentionDTO;
  active: boolean;
  href: string;
}) {
  return (
    <Link href={href} className={`opportunity-card${active ? " opportunity-card-active" : ""}`}>
      <div className="opportunity-meta">
        <TargetBadge type={mention.target_type} label={mention.target_label} />
        <span>r/{mention.subreddit}</span>
        {mention.posted_at && <span>{formatRelative(mention.posted_at)}</span>}
        {mention.author && <span>u/{mention.author}</span>}
        <span>{mention.num_comments} comments</span>
      </div>

      <h2 className="opportunity-heading">{mention.title}</h2>

      {mention.sentiment_reason && (
        <p className="opportunity-reason">{mention.sentiment_reason}</p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <SentimentPill sentiment={mention.sentiment} />
        <span style={{ fontSize: 12, color: "#8E8E93", fontWeight: 700 }}>
          ▲ {mention.reddit_score}
        </span>
      </div>
    </Link>
  );
}

function MentionDetail({
  mention,
  projectId,
}: {
  mention: BrandMentionDTO | null;
  projectId: string;
}) {
  if (!mention) {
    return (
      <section className="detail-pane">
        <div className="detail-content">
          <div className="empty-state">
            <p className="section-title">No mentions selected</p>
            <p className="section-copy" style={{ maxWidth: 480, margin: "10px auto 0" }}>
              Choose a mention from the list to inspect the full post and generate a reply.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const redditUrl = toRedditUrl(mention.permalink);

  return (
    <section className="detail-pane" aria-label="Mention detail">
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <TargetBadge type={mention.target_type} label={mention.target_label} />
          <span>r/{mention.subreddit}</span>
          {mention.posted_at && <span>{formatDate(mention.posted_at)}</span>}
          {mention.author && <span>u/{mention.author}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <SentimentPill sentiment={mention.sentiment} />
        </div>
      </div>

      <div className="detail-content">
        <h2 style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.02em", fontWeight: 700, color: "#1A1A1B" }}>
          {mention.title}
        </h2>

        {mention.sentiment_reason && (
          <p style={{ fontSize: 12, color: "#7C7C83", fontWeight: 600, marginTop: 10 }}>
            {mention.sentiment_reason}
          </p>
        )}
      </div>

      <article className="lead-post">
        <p className="reddit-body" style={{ fontSize: 13 }}>
          {mention.body?.trim() || "No body available. Open the post on Reddit to see the full context."}
        </p>

        <RedditComments permalink={mention.permalink} />

        <div className="post-stats-bar">
          {mention.reddit_score > 0 && <span>▲ {mention.reddit_score} upvotes</span>}
          <span>💬 {mention.num_comments} comments</span>
          <a href={redditUrl} target="_blank" rel="noreferrer" className="post-stats-link">
            View Post on Reddit →
          </a>
        </div>
      </article>

      <div className="lead-comment-box">
        <MentionReplyGenerator
          projectId={projectId}
          mentionId={mention.id}
          permalink={mention.permalink}
        />
      </div>
    </section>
  );
}

function TargetBadge({ type, label }: { type: string; label: string }) {
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

const SENTIMENT_CONFIG: Record<BrandMentionSentiment, { label: string; color: string; bg: string }> = {
  positive: { label: "Positive", color: "#059669", bg: "#ECFDF5" },
  negative: { label: "Negative", color: "#DC2626", bg: "#FEF2F2" },
  neutral: { label: "Neutral", color: "#7C7C83", bg: "#F8F8F7" },
};

function SentimentPill({ sentiment }: { sentiment: BrandMentionSentiment }) {
  const cfg = SENTIMENT_CONFIG[sentiment];
  return (
    <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6, color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function SentimentBar({
  projectId,
  target,
  selectedSentiment,
  selectedSort,
  mentionId,
  stats,
}: {
  projectId: string;
  target: string;
  selectedSentiment: BrandMentionSentiment | "all";
  selectedSort: string;
  mentionId?: string;
  stats: Record<string, number>;
}) {
  const items: Array<{ value: BrandMentionSentiment | "all"; label: string; color: string; bg: string }> = [
    { value: "all", label: "All", color: "#7C7C83", bg: "#F3F4F6" },
    { value: "positive", ...SENTIMENT_CONFIG.positive },
    { value: "neutral", ...SENTIMENT_CONFIG.neutral },
    { value: "negative", ...SENTIMENT_CONFIG.negative },
  ];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {items.map((item) => {
        const count = item.value === "all" ? stats.all : (stats[item.value] ?? 0);
        const active = selectedSentiment === item.value;
        return (
          <Link
            key={item.value}
            href={buildHref({
              projectId,
              mentionId,
              target,
              sentiment: item.value === "all" ? undefined : item.value,
              sort: selectedSort === "recent" ? "recent" : undefined,
            })}
            className={`filter-pill${active ? " filter-pill-active" : ""}`}
            style={active ? { borderColor: item.color, color: item.color, background: item.bg } : {}}
          >
            {item.label} <span style={{ fontWeight: 700, opacity: 0.7 }}>({count})</span>
          </Link>
        );
      })}
    </div>
  );
}

function SortControl({
  projectId,
  target,
  sentiment,
  selectedSort,
}: {
  projectId: string;
  target: string;
  sentiment: BrandMentionSentiment | "all";
  selectedSort: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: "#8E8E93", fontWeight: 800 }}>Sort</span>
      {["relevant", "recent"].map((sort) => (
        <Link
          key={sort}
          href={buildHref({
            projectId,
            target,
            sentiment: sentiment === "all" ? undefined : sentiment,
            sort: sort === "recent" ? "recent" : undefined,
          })}
          className={`filter-pill${selectedSort === sort ? " filter-pill-active" : ""}`}
        >
          {sort === "recent" ? "Most recent" : "Most discussed"}
        </Link>
      ))}
    </div>
  );
}

function MentionCountBadge({ count }: { count: number }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "#FFF3EC", border: "1px solid rgba(224,112,0,0.15)", fontSize: 13, fontWeight: 800, color: "#FF4500" }}>
      {count} mentions
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <MonitorIcon />
      <p className="section-title" style={{ marginTop: 14 }}>No mentions yet</p>
      <p className="section-copy" style={{ maxWidth: 400, margin: "10px auto 0" }}>
        Mentions are collected automatically every 12 hours. They track direct references to your brand name, URL, and configured competitors on Reddit.
      </p>
    </div>
  );
}

function MonitorIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true" style={{ margin: "0 auto", display: "block" }}>
      <rect width="44" height="44" rx="12" fill="#FFF3EC" />
      <circle cx="22" cy="19" r="7" stroke="#FF4500" strokeWidth="1.8" />
      <path d="M22 16v3l2 2" stroke="#FF4500" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 33c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#FF4500" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function buildHref({
  projectId,
  mentionId,
  target,
  sentiment,
  sort,
  page,
}: {
  projectId: string;
  mentionId?: string;
  target?: string;
  sentiment?: string;
  sort?: string;
  page?: number;
}) {
  const params = new URLSearchParams({ projectId });
  if (mentionId) params.set("mentionId", mentionId);
  if (target && target !== "all") params.set("target", target);
  if (sentiment) params.set("sentiment", sentiment);
  if (sort) params.set("sort", sort);
  if (page != null && page > 0) params.set("page", String(page));
  return `/mentions?${params.toString()}`;
}

function parseSentiment(value: string | undefined): BrandMentionSentiment | "all" {
  if (value === "positive" || value === "negative" || value === "neutral") return value;
  return "all";
}

function resolveTarget(target: string | undefined, companyName: string, competitors: KeywordDTO[]): string {
  if (!target || target === "all") return "all";
  if (target === companyName) return companyName;
  if (competitors.some((competitor) => competitor.term === target)) return target;
  return "all";
}

function filterByTarget(mentions: BrandMentionDTO[], target: string, companyName: string): BrandMentionDTO[] {
  if (target === "all") return mentions;
  if (target === companyName) return mentions.filter((mention) => mention.target_type === "company");
  return mentions.filter((mention) => mention.target_label === target);
}

function filterBySentiment(mentions: BrandMentionDTO[], sentiment: BrandMentionSentiment | "all"): BrandMentionDTO[] {
  if (sentiment === "all") return mentions;
  return mentions.filter((mention) => mention.sentiment === sentiment);
}

function sortMentions(mentions: BrandMentionDTO[], sort: string): BrandMentionDTO[] {
  return [...mentions].sort((a, b) => {
    if (sort === "recent") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return (b.num_comments ?? 0) - (a.num_comments ?? 0);
  });
}

function computeSentimentStats(mentions: BrandMentionDTO[]) {
  return mentions.reduce(
    (acc, mention) => {
      acc.all++;
      acc[mention.sentiment] = (acc[mention.sentiment] ?? 0) + 1;
      return acc;
    },
    { all: 0, positive: 0, neutral: 0, negative: 0 } as Record<string, number>,
  );
}

function buildTargetOptions(
  projectId: string,
  companyName: string,
  competitors: KeywordDTO[],
  selectedTarget: string,
): MentionTargetOption[] {
  return [
    {
      id: "all",
      label: "All mentions",
      description: "Brand + all competitors",
      href: buildHref({ projectId, target: "all" }),
      active: selectedTarget === "all",
    },
    {
      id: companyName,
      label: companyName,
      description: "Your brand mentions",
      href: buildHref({ projectId, target: companyName }),
      active: selectedTarget === companyName,
    },
    ...competitors.map((competitor) => ({
      id: competitor.term,
      label: competitor.term,
      description: "Competitor mentions",
      href: buildHref({ projectId, target: competitor.term }),
      active: selectedTarget === competitor.term,
    })),
  ];
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}
